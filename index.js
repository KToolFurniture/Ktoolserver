const express = require('express');
const { GoogleSpreadsheet } = require('google-spreadsheet');

const app = express();
app.use(express.json());

// Load credentials từ biến môi trường
const creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);

// ID Google Sheet của bạn
const SHEET_ID = '1yr2dGkD8UgeLBOhATmazqWTYR-PGf01CKCoXYRUQH1E';

// Hàm kết nối Google Sheets
async function accessSheet() {
  const doc = new GoogleSpreadsheet(SHEET_ID);
  await doc.useServiceAccountAuth(creds);
  await doc.loadInfo();
  return doc.sheetsByIndex[0]; // Lấy sheet đầu tiên
}

// Webhook nhận dữ liệu từ Sepay
app.post('/sepay-webhook', async (req, res) => {
  console.log('Received webhook:', req.body);

  try {
    const { transfer_amount, description } = req.body;

    // Lấy ID từ nội dung chuyển khoản
    const match = description.match(/ID:\s*([A-Z0-9]+)/i);
    if (!match) return res.status(400).send('No ID found in description');

    const id = match[1];
    let months = 0;

    // Xác định thời gian sử dụng dựa vào số tiền
    if (transfer_amount == 500000) months = 3;
    else if (transfer_amount == 900000) months = 6;
    else if (transfer_amount == 1600000) months = 12;
    else return res.status(400).send('Invalid amount');

    const sheet = await accessSheet();
    const rows = await sheet.getRows();

    // Tìm ID trong sheet
    let found = false;
    for (let row of rows) {
      if (row.ID === id) {
        let expiry = new Date(row.Expiry);
        expiry.setMonth(expiry.getMonth() + months);
        row.Expiry = expiry.toISOString().split('T')[0];
        await row.save();
        found = true;
        break;
      }
    }

    // Nếu chưa có ID thì tạo mới dòng
    if (!found) {
      let expiry = new Date();
      expiry.setMonth(expiry.getMonth() + months);
      await sheet.addRow({ ID: id, Expiry: expiry.toISOString().split('T')[0] });
    }

    res.send('OK');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error processing request');
  }
});

// Chạy server trên port (mặc định 3000)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
