import html2pdf from "html2pdf.js";
import { toPng } from "html-to-image";

export function exportElementToPDF(element, filename = "receipt.pdf") {
  if (!element) return Promise.reject(new Error("No element to export"));
  const opt = {
    margin: [10, 10, 10, 10],
    filename,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, backgroundColor: "#ffffff", useCORS: true },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    pagebreak: { mode: ["avoid-all", "css", "legacy"] },
  };
  return html2pdf().set(opt).from(element).save();
}

// HD PNG export via html-to-image. pixelRatio 2 gives Retina-quality output,
// backgroundColor is forced white so the receipt looks like a printed document.
export async function exportElementToImage(element, filename = "receipt.png") {
  if (!element) throw new Error("No element to export");
  const dataUrl = await toPng(element, {
    pixelRatio: 2,
    backgroundColor: "#ffffff",
    cacheBust: true,
    style: { transform: "scale(1)" },
  });
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
