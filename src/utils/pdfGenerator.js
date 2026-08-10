const PDFDocument = require('pdfkit');
const { supabase } = require('../config/supabase');

/**
 * Generate PDF sertifikat magang & upload ke Supabase Storage
 * @param {Object} data
 * @param {string} data.certificateNumber
 * @param {string} data.studentName
 * @param {string} data.internshipTitle
 * @param {string} data.commodity
 * @param {string} data.location
 * @param {number} data.durationMonths
 * @param {string[]} data.skills
 * @param {string} data.farmerName
 * @param {string} data.issuedDate
 * @returns {Promise<{ pdfUrl: string, pdfPath: string }>}
 */
async function generateAndUploadCertificate(data) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margins: { top: 40, bottom: 40, left: 50, right: 50 },
      });

      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));

      doc.on('end', async () => {
        try {
          const pdfBuffer = Buffer.concat(chunks);
          const filePath = `${data.certificateNumber}.pdf`;

          const { error } = await supabase.storage
            .from('certificates')
            .upload(filePath, pdfBuffer, {
              contentType: 'application/pdf',
              upsert: true,
            });

          if (error) {
            console.error('Supabase certificate upload error:', error);
            return reject(error);
          }

          const { data: urlData } = supabase.storage
            .from('certificates')
            .getPublicUrl(filePath);

          resolve({ pdfUrl: urlData.publicUrl, pdfPath: filePath });
        } catch (err) {
          reject(err);
        }
      });

      // === PDF Content & Styling ===
      // Border
      doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
        .lineWidth(2)
        .strokeColor('#16A34A')
        .stroke();

      doc.rect(25, 25, doc.page.width - 50, doc.page.height - 50)
        .lineWidth(0.5)
        .strokeColor('#16A34A')
        .stroke();

      // Header
      doc.fontSize(26).fillColor('#16A34A').font('Helvetica-Bold').text('SERTIFIKAT MAGANG', { align: 'center' });
      doc.moveDown(0.3);
      doc.fontSize(12).fillColor('#4B5563').font('Helvetica').text('Jadipetani — Platform Magang & Karir Pertanian', { align: 'center' });
      doc.moveDown(1.5);

      // Recipient
      doc.fontSize(11).fillColor('#374151').text('Diberikan kepada:', { align: 'center' });
      doc.moveDown(0.3);
      doc.fontSize(22).fillColor('#111827').font('Helvetica-Bold').text(data.studentName, { align: 'center' });
      doc.moveDown(0.8);

      // Statement
      doc.fontSize(11).fillColor('#374151').font('Helvetica')
        .text(`Atas kelulusan dan partisipasi aktif dalam program magang:`, { align: 'center' });
      doc.moveDown(0.3);

      doc.fontSize(16).fillColor('#16A34A').font('Helvetica-Bold')
        .text(data.internshipTitle, { align: 'center' });
      doc.moveDown(0.5);

      // Details
      doc.fontSize(10).fillColor('#4B5563').font('Helvetica')
        .text(`Komoditas: ${data.commodity}  |  Lokasi: ${data.location}  |  Durasi: ${data.durationMonths} Bulan`, { align: 'center' });
      doc.moveDown(1.2);

      // Competencies
      if (data.skills && data.skills.length > 0) {
        doc.fontSize(11).fillColor('#111827').font('Helvetica-Bold').text('Kompetensi yang Dikuasai:', { align: 'left' });
        doc.moveDown(0.3);
        data.skills.forEach((skill) => {
          doc.fontSize(10).fillColor('#374151').font('Helvetica').text(`• ${skill}`, { indent: 15 });
        });
        doc.moveDown(1);
      }

      // Footer / Signature
      const bottomY = doc.page.height - 130;
      doc.fontSize(12).fillColor('#111827').font('Helvetica-Oblique').text(data.farmerName, 550, bottomY, { align: 'center', width: 200 });
      doc.fontSize(10).fillColor('#6B7280').font('Helvetica').text('Pembimbing Program / Petani', 550, bottomY + 20, { align: 'center', width: 200 });

      doc.fontSize(9).fillColor('#9CA3AF').font('Helvetica')
        .text(`No. Sertifikat: ${data.certificateNumber}`, 50, bottomY + 20)
        .text(`Tanggal Terbit: ${data.issuedDate}`, 50, bottomY + 35);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateAndUploadCertificate };
