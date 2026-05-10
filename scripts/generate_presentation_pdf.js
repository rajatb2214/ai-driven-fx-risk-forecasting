const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const source = path.join(root, "docs", "project_explanation.md");
const output = path.join(root, "docs", "AI_Driven_FX_Risk_Forecasting_Project_Explanation.pdf");

const markdown = fs.readFileSync(source, "utf8");

function cleanInline(text) {
  return text
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/^- /, "• ");
}

function parse(md) {
  const lines = md.split(/\r?\n/);
  const blocks = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      blocks.push({ type: "space" });
    } else if (line.startsWith("# ")) {
      blocks.push({ type: "title", text: cleanInline(line.slice(2)) });
    } else if (line.startsWith("## ")) {
      blocks.push({ type: "heading", text: cleanInline(line.slice(3)) });
    } else if (/^\d+\.\s/.test(line)) {
      blocks.push({ type: "bullet", text: cleanInline(line.replace(/^\d+\.\s/, "")), ordered: true });
    } else if (line.startsWith("- ")) {
      blocks.push({ type: "bullet", text: cleanInline(line) });
    } else {
      blocks.push({ type: "para", text: cleanInline(line) });
    }
  }
  return blocks;
}

function wrapText(text, maxChars) {
  const words = text.split(/\s+/);
  const lines = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (test.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function esc(text) {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, char => {
      if (char === "•") return "\\267";
      return "-";
    });
}

function buildPages(blocks) {
  const pages = [];
  let ops = [];
  let y = 742;
  let pageNo = 1;

  function addHeader() {
    ops.push("0.10 0.13 0.18 rg");
    ops.push("BT /F2 9 Tf 50 772 Td (AI-Driven FX Risk Forecasting Project) Tj ET");
    ops.push("0.78 0.81 0.86 RG 0.75 w 50 760 m 545 760 l S");
    ops.push(`BT /F1 8 Tf 500 28 Td (Page ${pageNo}) Tj ET`);
  }

  function newPage() {
    if (ops.length) pages.push(ops.join("\n"));
    ops = [];
    y = 742;
    pageNo += 1;
    addHeader();
  }

  function ensure(height) {
    if (y - height < 56) newPage();
  }

  function textLine(text, x, size, font = "F1", color = "0.10 0.13 0.18") {
    ops.push(`${color} rg`);
    ops.push(`BT /${font} ${size} Tf ${x} ${y} Td (${esc(text)}) Tj ET`);
  }

  addHeader();

  for (const block of blocks) {
    if (block.type === "space") {
      y -= 6;
      continue;
    }

    if (block.type === "title") {
      ensure(80);
      y -= 10;
      for (const line of wrapText(block.text, 42)) {
        textLine(line, 50, 23, "F2", "0.02 0.08 0.18");
        y -= 30;
      }
      ops.push("0.15 0.39 0.85 RG 2 w 50 " + (y + 8) + " m 260 " + (y + 8) + " l S");
      y -= 18;
      continue;
    }

    if (block.type === "heading") {
      ensure(44);
      y -= 14;
      for (const line of wrapText(block.text, 58)) {
        textLine(line, 50, 15, "F2", "0.02 0.08 0.18");
        y -= 20;
      }
      y -= 4;
      continue;
    }

    if (block.type === "bullet") {
      const lines = wrapText(block.text, 86);
      ensure(lines.length * 15 + 6);
      lines.forEach((line, index) => {
        const prefix = index === 0 ? (block.ordered ? "• " : "") : "  ";
        textLine(prefix + line, 68, 10.5);
        y -= 15;
      });
      y -= 2;
      continue;
    }

    const lines = wrapText(block.text, 92);
    ensure(lines.length * 15 + 8);
    for (const line of lines) {
      textLine(line, 50, 10.5);
      y -= 15;
    }
    y -= 4;
  }

  pages.push(ops.join("\n"));
  return pages;
}

function pdfString(pages) {
  const objects = [];
  const add = body => {
    objects.push(body);
    return objects.length;
  };

  const font1 = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const font2 = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
  const pageKids = [];

  for (const content of pages) {
    const stream = Buffer.from(content, "binary");
    const contentId = add(`<< /Length ${stream.length} >>\nstream\n${content}\nendstream`);
    const pageId = add(`<< /Type /Page /Parent PAGES_ID 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${font1} 0 R /F2 ${font2} 0 R >> >> /Contents ${contentId} 0 R >>`);
    pageKids.push(pageId);
  }

  const pagesId = add(`<< /Type /Pages /Kids [${pageKids.map(id => `${id} 0 R`).join(" ")}] /Count ${pageKids.length} >>`);
  const catalogId = add(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);

  for (let i = 0; i < objects.length; i++) {
    objects[i] = objects[i].replace(/PAGES_ID/g, String(pagesId));
  }

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((body, idx) => {
    offsets.push(Buffer.byteLength(pdf, "binary"));
    pdf += `${idx + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = Buffer.byteLength(pdf, "binary");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return pdf;
}

const pages = buildPages(parse(markdown));
fs.writeFileSync(output, pdfString(pages), "binary");
console.log(`Created ${output}`);
