(function () {
  const jsonPath = 'ready/Fault Tolerance Concepts and Redundancy - NotebookLM.mindmap.json';
  // Layout direction: 'ltr' -> children open to the right, 'rtl' -> children open to the left
  const LAYOUT = 'ltr';
  const GROWS_RIGHT = LAYOUT === 'ltr';
  const svg = d3.select('#svg');
  const zoomRoot = d3.select('#zoomRoot');
  const gLinks = d3.select('#links');
  const gNodes = d3.select('#nodes');
  const tooltip = document.getElementById('tooltip');

  const width = () => svg.node().clientWidth;
  const height = () => svg.node().clientHeight;

  const zoom = d3.zoom().scaleExtent([0.2, 2.5]).on('zoom', (event) => {
    zoomRoot.attr('transform', event.transform);
  });
  svg.call(zoom);

  function diagonal(s, d) {
    // Attach to the rectangle edges horizontally
    const sw = computeNodeSize(s).w;
    const dw = computeNodeSize(d).w;
    const sx = s.x; // vertical
    const sy = GROWS_RIGHT ? (s.y + sw) : (s.y - sw); // horizontal start at edge
    const dx = d.x; // vertical
    const dy = GROWS_RIGHT ? d.y : d.y; // target anchor: left edge for LTR (rect x=0), right edge for RTL (rect right at 0)
    const c1y = (sy + dy) / 2;
    const c2y = (sy + dy) / 2;
    const path = `M ${sy},${sx} C ${c1y},${sx} ${c2y},${dx} ${dy},${dx}`;
    return path;
  }

  function wrapText(selection, maxWidth) {
    selection.each(function (d) {
      const text = d3.select(this);
      const words = (d.data.title || '').split(/\s+/).filter(Boolean);
      let line = [];
      let lineNumber = 0;
      const lineHeight = 1.3;
      const y = text.attr('y') || 0;
      const x = text.attr('x') || 0;
      
      // حساب عدد الأسطر أولاً
      let tempLines = [];
      let tempLine = [];
      const tempText = text.clone(true);
      let tempTspan = tempText.append('tspan').attr('x', x).attr('y', y);
      
      for (const word of words) {
        tempLine.push(word);
        tempTspan.text(tempLine.join(' '));
        if (tempTspan.node().getComputedTextLength() > maxWidth && tempLine.length > 1) {
          tempLine.pop();
          tempLines.push(tempLine.join(' '));
          tempLine = [word];
          tempTspan.text(word);
        }
      }
      if (tempLine.length > 0) {
        tempLines.push(tempLine.join(' '));
      }
      tempText.remove();
      
      // حساب الإزاحة للوسط
      const totalLines = tempLines.length;
      const startDy = -(totalLines - 1) * lineHeight / 2;
      
      let tspan = text.text(null).append('tspan').attr('x', x).attr('y', y).attr('dy', startDy + 'em');
      line = [];
      lineNumber = 0;
      
      for (const word of words) {
        line.push(word);
        tspan.text(line.join(' '));
        if (tspan.node().getComputedTextLength() > maxWidth && line.length > 1) {
          line.pop();
          tspan.text(line.join(' '));
          line = [word];
          tspan = text.append('tspan').attr('x', x).attr('y', y).attr('dy', (startDy + (++lineNumber * lineHeight)) + 'em').text(word);
        }
      }
    });
  }

  function collapse(d) {
    if (d.children) {
      d._children = d.children;
      d._children.forEach(collapse);
      d.children = null;
    }
  }

  function expand(d) {
    if (d._children) {
      d.children = d._children;
      d._children = null;
    }
    (d.children || []).forEach(expand);
  }

  function computeNodeSize(d) {
    const ctx = document.createElement('canvas').getContext('2d');
    ctx.font = '14px Cairo, system-ui, -apple-system, Segoe UI, Roboto, Arial';
    const text = d.data.title || '';
    const words = text.split(/\s+/).filter(Boolean);
    const maxWidth = 250;
    let lines = [];
    let currentLine = [];
    
    for (const word of words) {
      currentLine.push(word);
      const lineText = currentLine.join(' ');
      if (ctx.measureText(lineText).width > maxWidth && currentLine.length > 1) {
        currentLine.pop();
        lines.push(currentLine.join(' '));
        currentLine = [word];
      }
    }
    if (currentLine.length > 0) {
      lines.push(currentLine.join(' '));
    }
    
    const widths = lines.map(line => ctx.measureText(line).width);
    const w = Math.max(...widths, 100) + 50;
    const h = Math.max(40, lines.length * 22 + 18);
    return { w, h };
  }

  function render(root) {
    const nodeSepX = 320; // horizontal distance per depth (increased)

    const treeLayout = d3.tree().nodeSize([60, nodeSepX]);
    treeLayout(root);

    // Normalize y based on depth based on direction
    root.each(d => { d.y = (GROWS_RIGHT ? d.depth : -d.depth) * nodeSepX; });

    // LINKS
    const link = gLinks.selectAll('path.link').data(root.links(), d => d.target.data.title + '_' + d.target.depth + '_' + d.target.index);
    link.join(
      enter => enter.append('path').attr('class', 'link').attr('d', d => diagonal(d.source, d.target)),
      update => update.attr('d', d => diagonal(d.source, d.target)),
      exit => exit.remove()
    );

    // NODES
    const node = gNodes.selectAll('g.node').data(root.descendants(), d => d.data.title + '_' + d.depth + '_' + d.index);

    const nodeEnter = node.enter().append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.y},${d.x})`)
      .style('cursor', 'pointer')
      .on('click', function (event, d) {
        if (d.children) { d._children = d.children; d.children = null; }
        else { d.children = d._children; d._children = null; }
        update(root);
      })
      .on('mousemove', function (event, d) {
        tooltip.style.display = 'block';
        tooltip.textContent = d.data.title;
        tooltip.style.left = (event.clientX + 10) + 'px';
        tooltip.style.top = (event.clientY + 10) + 'px';
      })
      .on('mouseleave', function () { tooltip.style.display = 'none'; });

    nodeEnter.append('rect')
      .attr('x', d => GROWS_RIGHT ? 0 : -computeNodeSize(d).w)
      .attr('y', d => -computeNodeSize(d).h / 2)
      .attr('width', d => computeNodeSize(d).w)
      .attr('height', d => computeNodeSize(d).h)
      .attr('rx', 8).attr('ry', 8);

    nodeEnter.append('text')
      .attr('x', d => GROWS_RIGHT ? 25 : -25)
      .attr('y', 0)
      .attr('text-anchor', GROWS_RIGHT ? 'start' : 'end')
      .text(d => d.data.title)
      .call(sel => wrapText(sel, 250));

    const nodeUpdate = nodeEnter.merge(node);
    nodeUpdate.transition().duration(250).attr('transform', d => `translate(${d.y},${d.x})`);

    node.exit().remove();
  }

  function update(root) { render(root); }

  function fitToScreen() {
    const bbox = zoomRoot.node().getBBox();
    const w = width(), h = height();
    const scale = Math.max(0.2, Math.min(1.2, 0.9 / Math.max(bbox.width / w, bbox.height / h)));
    const tx = (w - bbox.width * scale) / 2 - bbox.x * scale;
    const ty = (h - bbox.height * scale) / 2 - bbox.y * scale;
    svg.transition().duration(350).call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
  }

  // Load JSON and draw
  fetch(jsonPath)
    .then(r => r.json())
    .then(data => {
      // If file is an array of roots, build a dummy root
      const isArrayRoot = Array.isArray(data);
      const rootData = isArrayRoot ? { title: 'ROOT', children: data } : data;
      const root = d3.hierarchy(rootData, d => d.children);

      // Collapse all except depth 0/1
      root.children && root.children.forEach(d => {
        if (d.children) {
          d._children = d.children;
          d._children.forEach(collapse);
          d.children = null;
        }
      });

      render(root);
      setTimeout(fitToScreen, 300);

      document.getElementById('fit').onclick = fitToScreen;
      document.getElementById('expandAll').onclick = () => { expand(root); render(root); fitToScreen(); };
      document.getElementById('collapseAll').onclick = () => { root.each(collapse); render(root); fitToScreen(); };
    })
    .catch(err => {
      alert('Failed to load JSON: ' + err);
      console.error(err);
    });
})();
