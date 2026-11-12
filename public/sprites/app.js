(() => {
  function detectGrid(pixels, width, height) {
    const horizontal = new Uint32Array(width), vertical = new Uint32Array(height);
    const transparent = [0, width - 1, width * (height - 1), width * height - 1]
      .some(i => pixels[i * 4 + 3] < 100);
    const corners = [0, width - 1, width * (height - 1), width * height - 1];
    const background = [0, 1, 2].map(channel =>
      corners.map(i => pixels[i * 4 + channel]).sort((a, b) => a - b)[2]);
    const mask = new Uint8Array(width * height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = y * width + x, i = index * 4;
        if (pixels[i + 3] < 70) continue;
        if (!transparent && Math.max(...background.map((bg, c) => Math.abs(pixels[i + c] - bg))) < 42) continue;
        mask[index] = 1;
        horizontal[x]++;
        vertical[y]++;
      }
    }
    function divisions(projection) {
      const length = projection.length;
      const peak = Math.max(...projection);
      if (!peak) return 1;
      const gutter = Math.max(1, peak * .028);
      for (let count = Math.min(128, Math.floor(length / 7)); count >= 2; count--) {
        const cell = length / count;
        const tolerance = Math.max(1, Math.round(cell * .065));
        let valid = true;
        for (let i = 1; i < count && valid; i++) {
          const boundary = Math.round(i * cell);
          let empty = false;
          for (let x = boundary - tolerance; x <= boundary + tolerance; x++) {
            if (projection[x] <= gutter && projection[x + 1] <= gutter) { empty = true; break; }
          }
          valid = empty;
        }
        for (let i = 0; i < count && valid; i++) {
          const start = Math.ceil((i + .12) * cell), end = Math.floor((i + .88) * cell);
          let active = 0;
          for (let x = start; x < end; x++) if (projection[x] > gutter) active++;
          valid = active >= Math.max(2, cell * .17);
        }
        if (valid) return count;
      }
      return 1;
    }
    const columns = divisions(horizontal), rows = divisions(vertical);
    let frames = columns * rows;
    while (frames > 1) {
      const column = (frames - 1) % columns, row = Math.floor((frames - 1) / columns);
      let ink = 0;
      for (let y = Math.round(row * height / rows); y < Math.round((row + 1) * height / rows); y++)
        for (let x = Math.round(column * width / columns); x < Math.round((column + 1) * width / columns); x++)
          ink += mask[y * width + x];
      if (ink >= Math.max(2, width * height / (columns * rows) * .005)) break;
      frames--;
    }
    return {columns, rows, frames};
  }
  const root = document.getElementById('sprite-player');
  const get = name => root.querySelector('[data-' + name + ']');
  const canvas = root.querySelector('canvas');
  const context = canvas.getContext('2d');
  const positive = (name, maximum) => Math.max(1, Math.min(maximum, Math.trunc(Number(get(name).value)) || 1));
  let sheet, frame = 0, playing = false, last = 0, pending = 0, frameTiming = null;
  const totalFrames = () => Math.min(positive('frames', 65536), positive('cols', 256) * positive('rows', 256));
  const startFrame = () => Math.max(0, Number(get('row').value)) * positive('cols', 256);
  const count = () => Number(get('row').value) < 0 ? totalFrames() : Math.max(1, Math.min(positive('cols', 256), totalFrames() - startFrame()));
  function updateRows() {
    const select = get('row'), previous = select.value;
    select.replaceChildren(new Option('All rows', '-1'));
    const rows = Math.ceil(totalFrames() / positive('cols', 256));
    for (let i = 0; i < rows; i++) select.add(new Option('Row ' + (i + 1), i));
    select.value = Number(previous) < rows ? previous : '-1';
    if (!select.value) select.value = '-1';
    select.disabled = rows === 1;
  }
  function autoDetect() {
    if (!sheet) return;
    const probe = document.createElement('canvas');
    const scale = Math.min(1, 1400 / Math.max(sheet.naturalWidth, sheet.naturalHeight));
    probe.width = Math.max(1, Math.round(sheet.naturalWidth * scale));
    probe.height = Math.max(1, Math.round(sheet.naturalHeight * scale));
    const ctx = probe.getContext('2d', {willReadFrequently: true});
    ctx.drawImage(sheet, 0, 0, probe.width, probe.height);
    const {columns, rows, frames} = detectGrid(ctx.getImageData(0, 0, probe.width, probe.height).data, probe.width, probe.height);
    if (frames > 1) {
      get('cols').value = columns;
      get('rows').value = rows;
      get('frames').value = frames;
      get('status').textContent = 'Detected ' + columns + ' × ' + rows + ' · ' + frames + ' frames';
    } else {
      get('status').textContent = 'No clear grid detected. Enter columns, rows and frames to set the layout.';
    }
    frame = 0;
    get('row').value = '-1';
    updateRows();
    draw();
  }
  function draw() {
    const total = count();
    frame = Math.max(0, Math.min(frame, total - 1));
    get('frame').max = total;
    get('frame').value = frame + 1;
    get('count').textContent = sheet ? (frame + 1) + ' / ' + total : '—';
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (!sheet) return;
    const columns = positive('cols', 256), rows = positive('rows', 256);
    const index = frame + startFrame();
    const column = index % columns, row = Math.floor(index / columns);
    const x = Math.round(column * sheet.naturalWidth / columns);
    const y = Math.round(row * sheet.naturalHeight / rows);
    const w = Math.round((column + 1) * sheet.naturalWidth / columns) - x;
    const h = Math.round((row + 1) * sheet.naturalHeight / rows) - y;
    if (w < 1 || h < 1) return;
    const scale = Math.min(canvas.width / w, canvas.height / h);
    context.drawImage(sheet, x, y, w, h, (canvas.width - w * scale) / 2, (canvas.height - h * scale) / 2, w * scale, h * scale);
  }
  function pause() {
    playing = false;
    cancelAnimationFrame(pending);
    get('play').textContent = 'Play';
  }
  function tick(now) {
    if (!playing) return;
    let interval = frameTiming?.[frame + startFrame()] || 1000 / positive('fps', 60);
    let steps = 0;
    while (now - last >= interval && steps < 120) {
      last += interval;
      steps++;
      if (frame + 1 === count() && !get('loop').checked) {
        pause(); draw(); return;
      }
      frame = (frame + 1) % count();
      interval = frameTiming?.[frame + startFrame()] || 1000 / positive('fps', 60);
    }
    if (steps) draw();
    pending = requestAnimationFrame(tick);
  }
  function play() {
    if (!sheet) return;
    if (!get('loop').checked && frame === count() - 1) { frame = 0; draw(); }
    playing = true;
    last = performance.now();
    get('play').textContent = 'Pause';
    pending = requestAnimationFrame(tick);
  }
  function load(image, label, detect) {
    pause();
    sheet = image;
    frame = 0;
    get('empty').hidden = true;
    get('status').textContent = label;
    updateRows();
    if (detect) autoDetect();
    draw();
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) play();
  }
  get('play').onclick = () => playing ? pause() : play();
  get('prev').onclick = () => { pause(); frame = (frame + count() - 1) % count(); draw(); };
  get('next').onclick = () => { pause(); frame = (frame + 1) % count(); draw(); };
  get('frame').oninput = event => { pause(); frame = Number(event.target.value) - 1; draw(); };
  get('detect').onclick = autoDetect;
  get('row').onchange = () => { frame = 0; last = performance.now(); draw(); };
  for (const name of ['cols', 'rows', 'frames']) get(name).oninput = () => { frameTiming = null; updateRows(); draw(); };
  get('fps').oninput = () => { frameTiming = null; last = performance.now(); };
  let selection = 0;
  async function pngMetadata(file) {
    const bytes = await file.arrayBuffer();
    const view = new DataView(bytes), decode = new TextDecoder();
    if (view.byteLength < 8 || view.getUint32(0) !== 0x89504e47) return null;
    const data = {};
    for (let offset = 8; offset + 12 <= view.byteLength;) {
      const length = view.getUint32(offset);
      if (length > view.byteLength - offset - 12) break;
      const type = view.getUint32(offset + 4);
      if (type === 0x74455874 && length < 100000) {
        const value = new Uint8Array(bytes, offset + 8, length);
        const zero = value.indexOf(0);
        if (zero > 0) data[decode.decode(value.subarray(0, zero))] = decode.decode(value.subarray(zero + 1));
      }
      offset += 12 + length;
    }
    const layout = /([0-9]+) columns?, ([0-9]+) rows?/i.exec(data.Layout || '');
    if (!layout) return null;
    const columns = Number(layout[1]), rows = Number(layout[2]);
    if (!(columns >= 1 && columns <= 256 && rows >= 1 && rows <= 256)) return null;
    let timings;
    try { timings = JSON.parse(data.Frames).map(frame => frame.duration_ms); } catch {}
    if (!timings?.length || timings.length > columns * rows || !timings.every(ms => Number.isFinite(ms) && ms >= 10 && ms <= 60000)) timings = null;
    return {columns, rows, timings};
  }
  async function openFile(file) {
    if (!file) return;
    const id = ++selection;
    const url = URL.createObjectURL(file);
    const image = new Image();
    try {
      image.src = url;
      await image.decode();
      const meta = await pngMetadata(file).catch(() => null);
      if (id !== selection) return;
      frameTiming = meta?.timings || null;
      for (const name of ['cols','rows','frames']) get(name).value = 1;
      if (meta) {
        get('cols').value = meta.columns;
        get('rows').value = meta.rows;
        get('frames').value = meta.timings?.length || meta.columns * meta.rows;
      }
      get('row').value = '-1';
      load(image, file.name, !meta);
      if (meta) get('status').textContent = file.name + ' · ' + count() + ' frames' + (frameTiming ? ' · Original timing' : '');
    } catch {
      if (id === selection) get('status').textContent = 'Could not read this image. Try PNG, JPEG or WebP.';
    } finally { URL.revokeObjectURL(url); }
  }
  get('file').onchange = event => {
    openFile(event.target.files[0]);
    event.target.value = '';
  };
  root.addEventListener('dragover', event => event.preventDefault());
  root.addEventListener('drop', event => { event.preventDefault(); openFile(event.dataTransfer.files[0]); });
  document.addEventListener('paste', event => {
    const file = Array.from(event.clipboardData?.files || []).find(item => item.type.startsWith('image/'));
    if (file) { event.preventDefault(); openFile(file); }
  });
  get('demo').onclick = async () => {
    const id = ++selection;
    try {
      const response = await fetch('./sample.png');
      if (!response.ok) throw Error();
      const blob = await response.blob();
      if (id === selection) openFile(new File([blob], 'Bouncing ball sample.png', {type:'image/png'}));
    } catch { if (id === selection) get('status').textContent = 'Sample unavailable. Choose an image to start.'; }
  };
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
  draw();
})();
