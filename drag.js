// Arrossegar nodes del diagrama (SVG generat per Python) i descarregar-lo.
(() => {
  const host = document.getElementById("diagram");
  const dl = document.getElementById("dl");
  let drag = null;

  const svgPoint = (svg, ev) => {
    const pt = svg.createSVGPoint();
    pt.x = ev.clientX;
    pt.y = ev.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  };

  // Recalcula una fletxa perquè vagi de vora a vora dels dos cercles
  const place = (line, nodes) => {
    const a = nodes.get(line.dataset.a), b = nodes.get(line.dataset.b);
    const ax = +a.dataset.x, ay = +a.dataset.y, bx = +b.dataset.x, by = +b.dataset.y;
    const d = Math.hypot(bx - ax, by - ay) || 1;
    const ux = (bx - ax) / d, uy = (by - ay) / d;
    line.setAttribute("x1", ax + ux * +a.dataset.r);
    line.setAttribute("y1", ay + uy * +a.dataset.r);
    line.setAttribute("x2", bx - ux * +b.dataset.r);
    line.setAttribute("y2", by - uy * +b.dataset.r);
  };

  host.addEventListener("pointerdown", (ev) => {
    const g = ev.target.closest(".node");
    if (!g) return;
    const svg = g.ownerSVGElement;
    const p = svgPoint(svg, ev);
    drag = {
      g, svg,
      nodes: new Map([...svg.querySelectorAll(".node")].map((n) => [n.dataset.id, n])),
      edges: [...svg.querySelectorAll(".edge")].filter(
        (l) => l.dataset.a === g.dataset.id || l.dataset.b === g.dataset.id),
      ox: p.x - +g.dataset.x,
      oy: p.y - +g.dataset.y,
    };
    g.setPointerCapture(ev.pointerId);
    g.classList.add("dragging");
    g.parentNode.appendChild(g); // porta el node al davant
    ev.preventDefault();
  });

  host.addEventListener("pointermove", (ev) => {
    if (!drag) return;
    const { g, svg, nodes, edges, ox, oy } = drag;
    const vb = svg.viewBox.baseVal;
    const r = +g.dataset.r;
    const p = svgPoint(svg, ev);
    const x = Math.min(Math.max(p.x - ox, r), vb.width - r);
    const y = Math.min(Math.max(p.y - oy, r), vb.height - r);
    g.dataset.x = x;
    g.dataset.y = y;
    g.setAttribute("transform", `translate(${x},${y})`);
    edges.forEach((l) => place(l, nodes));
  });

  const stop = () => {
    if (!drag) return;
    drag.g.classList.remove("dragging");
    drag = null;
  };
  host.addEventListener("pointerup", stop);
  host.addEventListener("pointercancel", stop);

  // Descàrrega: serialitza l'SVG tal com està ara (amb les posicions noves)
  dl.addEventListener("click", () => {
    const svg = host.querySelector("svg");
    if (!svg) return;
    const xml = new XMLSerializer().serializeToString(svg);
    if (dl.href.startsWith("blob:")) URL.revokeObjectURL(dl.href);
    dl.href = URL.createObjectURL(new Blob([xml], { type: "image/svg+xml" }));
  });
})();