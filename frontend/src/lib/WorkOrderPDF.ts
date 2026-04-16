/**
 * Work Order PDF Generator
 *
 * Builds a professional "Municipal Infrastructure Work Order" PDF using jsPDF.
 * Fetches the Cloudinary annotated image, embeds it, and triggers a browser download.
 */
import { jsPDF } from "jspdf";

interface PotholeData {
  _id: string;
  image_url: string;
  latitude: number;
  longitude: number;
  severity: string;
  timestamp: string;
  detections: { bbox: number[]; confidence: number }[];
}

/**
 * Convert an image URL to a Base-64 data URL by drawing it on an offscreen canvas.
 */
async function imageUrlToBase64(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => reject(new Error("Failed to load image for PDF"));
    img.src = url;
  });
}

function getEstSpan(severity: string): string {
  if (/critical/i.test(severity)) return "> 500 mm";
  if (/high/i.test(severity)) return "100 – 400 mm";
  if (/moderate/i.test(severity)) return "50 – 100 mm";
  return "< 50 mm";
}

function getPCIColor(score: number): [number, number, number] {
  if (score >= 85) return [34, 197, 94];   // green
  if (score >= 55) return [234, 179, 8];   // yellow
  return [239, 68, 68];                     // red
}

function getPCILabel(score: number): string {
  if (score >= 85) return "Good";
  if (score >= 55) return "Fair";
  return "Poor";
}

export async function generateWorkOrderPDF(
  pothole: PotholeData,
  pciScore: number,
): Promise<void> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 18;
  let y = margin;

  // ── Header Band ──────────────────────────────────────────────────────────
  doc.setFillColor(15, 15, 20);
  doc.rect(0, 0, pageW, 38, "F");

  doc.setFillColor(108, 30, 205);
  doc.rect(0, 38, pageW, 1.5, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(214, 186, 255);
  doc.text("Municipal Infrastructure Work Order", pageW / 2, 16, { align: "center" });

  doc.setFontSize(9);
  doc.setTextColor(180, 180, 190);
  doc.text("AI Pothole Detection System — Smart City Division", pageW / 2, 24, { align: "center" });

  const generatedAt = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 160);
  doc.text(`Generated: ${generatedAt} IST`, pageW / 2, 32, { align: "center" });

  y = 48;

  // ── Section: Detection Overview ──────────────────────────────────────────
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(40, 40, 50);
  doc.text("1. Detection Overview", margin, y);
  y += 8;

  // Info table
  const detectedAt = new Date(pothole.timestamp).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  const rows: [string, string][] = [
    ["Record ID", pothole._id],
    ["Detected At", `${detectedAt} IST`],
    ["Coordinates", `${pothole.latitude.toFixed(6)}, ${pothole.longitude.toFixed(6)}`],
    ["Detection Count", String(pothole.detections.length)],
    ["Estimated Span", getEstSpan(pothole.severity)],
  ];

  doc.setFontSize(9);
  for (const [label, value] of rows) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(80, 80, 90);
    doc.text(`${label}:`, margin, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(40, 40, 50);
    doc.text(value, margin + 40, y);
    y += 6;
  }

  y += 4;

  // ── Section: Severity Assessment  ─────────────────────────────────────────
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(40, 40, 50);
  doc.text("2. Severity Assessment", margin, y);
  y += 8;

  // Severity badge
  const severityColors: Record<string, [number, number, number]> = {
    Critical: [220, 38, 38],
    High: [249, 115, 22],
    Moderate: [234, 179, 8],
    Low: [156, 163, 175],
  };
  const sc = severityColors[pothole.severity] || [100, 100, 100];
  doc.setFillColor(sc[0], sc[1], sc[2]);
  doc.roundedRect(margin, y - 4, 36, 8, 2, 2, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text(pothole.severity.toUpperCase(), margin + 18, y + 1.5, { align: "center" });

  // PCI score
  const pciColor = getPCIColor(pciScore);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 90);
  doc.text(`Pavement Condition Index (PCI):`, margin + 42, y + 1.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(pciColor[0], pciColor[1], pciColor[2]);
  doc.text(`${pciScore} / 100 — ${getPCILabel(pciScore)}`, margin + 90, y + 1.5);

  y += 16;

  // ── Section: Annotated Image ──────────────────────────────────────────────
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(40, 40, 50);
  doc.text("3. Annotated Detection Image", margin, y);
  y += 6;

  try {
    const imgData = await imageUrlToBase64(pothole.image_url);
    const imgW = pageW - margin * 2;
    const imgH = imgW * 0.6; // 5:3 aspect ratio
    doc.addImage(imgData, "JPEG", margin, y, imgW, imgH);
    y += imgH + 6;
  } catch {
    doc.setFontSize(9);
    doc.setTextColor(200, 60, 60);
    doc.text("[Image could not be embedded — see Cloudinary URL below]", margin, y);
    y += 6;
    doc.setTextColor(60, 60, 220);
    doc.textWithLink(pothole.image_url, margin, y, { url: pothole.image_url });
    y += 8;
  }

  // ── Section: Recommended Actions ──────────────────────────────────────────
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(40, 40, 50);
  doc.text("4. Recommended Actions", margin, y);
  y += 8;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 70);
  const actions: Record<string, string[]> = {
    Critical: [
      "• Immediate road closure or barricading within 24 hours.",
      "• Deploy emergency patching crew with hot-mix asphalt.",
      "• Notify traffic management and local authorities.",
      "• Schedule full-depth repair within 72 hours.",
    ],
    High: [
      "• Schedule patching crew deployment within 48 hours.",
      "• Install temporary warning signage.",
      "• Monitor for further degradation.",
    ],
    Moderate: [
      "• Add to scheduled maintenance queue (7-day SLA).",
      "• Apply surface sealant or cold-patch.",
    ],
    Low: [
      "• Log for next maintenance cycle.",
      "• Monitor during routine inspections.",
    ],
  };
  for (const line of actions[pothole.severity] || actions.Low) {
    doc.text(line, margin, y);
    y += 5;
  }

  y += 6;

  // ── Footer ────────────────────────────────────────────────────────────────
  doc.setDrawColor(200, 200, 210);
  doc.line(margin, y, pageW - margin, y);
  y += 6;
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 160);
  doc.text(
    "This document was auto-generated by the AI Pothole Detection System. Severity and PCI values are model-estimated.",
    pageW / 2,
    y,
    { align: "center" },
  );
  doc.text(
    "Verify field conditions before allocating resources. © Smart City Infrastructure Division",
    pageW / 2,
    y + 4,
    { align: "center" },
  );

  // ── Download ──────────────────────────────────────────────────────────────
  const safeName = `WorkOrder_${pothole._id.slice(-6).toUpperCase()}_${Date.now()}`;
  doc.save(`${safeName}.pdf`);
}
