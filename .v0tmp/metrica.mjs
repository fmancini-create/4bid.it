import { PDFDocument, StandardFonts } from "pdf-lib"
const pdf = await PDFDocument.create()
const f = await pdf.embedFont(StandardFonts.Helvetica)
for (const t of ["Telefonate,", "email,", "WhatsApp,", "richieste", " "]) {
  console.log(JSON.stringify(t), "pdf-lib w =", f.widthOfTextAtSize(t, 10.5).toFixed(2))
}
// Il conto che conta: dove finisce "Telefonate," + uno spazio, e dove inizia "email,"
const x0 = 62
const fine = x0 + f.widthOfTextAtSize("Telefonate,", 10.5) + f.widthOfTextAtSize(" ", 10.5)
console.log("inizio atteso di 'email,':", fine.toFixed(2), "| osservato nel PDF: 115.72")
