// react-pdf 10.x sets a bare-specifier default (`pdf.worker.mjs`) at module
// load. Dynamic-importing react-pdf must always go through this loader so the
// worker URL is fixed to the copy in /public before any <Document> mounts.
export async function loadReactPdf() {
  const mod = await import("react-pdf");
  mod.pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  return mod;
}
