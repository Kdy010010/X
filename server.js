const express = require('express');
const multer = require('multer');
const nodemailer = require('nodemailer');
const session = require('express-session');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// 파일 저장 설정
const upload = multer({ dest: 'uploads/' });

// 세션 설정
app.use(session({
  secret: 'secret_key',
  resave: false,
  saveUninitialized: true,
}));

// HTML 폼 제공
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 이메일 전송 설정
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your-email@gmail.com', // 본인의 Gmail 계정
    pass: 'your-email-password', // Gmail 앱 비밀번호
  },
});

// 파일 업로드 및 이메일 전송
app.post('/upload', upload.single('file'), async (req, res) => {
  const userEmail = req.body.email;

  // 세션으로 일일 사용 횟수 제한
  if (!req.session.usageCount) {
    req.session.usageCount = 0;
  }
  if (req.session.usageCount >= 10) {
    return res.status(403).send('일일 이용 제한(10회)을 초과했습니다.');
  }

  try {
    const mailOptions = {
      from: '${userEmail}',
      to: 'kdywkrrk@gmail.com',
      subject: `파일 업로드 - ${userEmail}`,
      text: `사용자 이메일: ${userEmail}\n업로드된 파일이 첨부되었습니다.`,
      attachments: [
        {
          filename: req.file.originalname,
          path: req.file.path,
        },
      ],
    };

    await transporter.sendMail(mailOptions);

    // 사용 횟수 증가
    req.session.usageCount += 1;

    // 업로드된 파일 삭제
    fs.unlinkSync(req.file.path);

    res.send('파일이 성공적으로 업로드되고 이메일이 전송되었습니다.');
  } catch (error) {
    console.error(error);
    res.status(500).send('파일 전송 중 문제가 발생했습니다.');
  }
});

// 서버 실행
app.listen(PORT, () => {
  console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});
