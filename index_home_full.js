// index_home_full.js
// 🧠 집 버전 완전 자동화 (GPT 리포트 활성화 + 통계 + 로그)

// ===== 설정 =====
import axios from "axios";
import dotenv from "dotenv";
import fs from "fs";
dotenv.config();

const COIN_SYMBOL = "BTC_KRW";
const LOG_FILE = "log.txt";
const REPORT_FILE = "report.txt";
const DAILY_FILE = "daily_summary.txt";
const GPT_KEY = process.env.OPENAI_API_KEY;
const INTERVAL_MIN = 10; // 주기(분)

// ===== 전역 변수 =====
let lastPrice = null;

// ===== 시세 가져오기 =====
async function getPrice() {
  try {
    const res = await axios.get(`https://api.bithumb.com/public/ticker/${COIN_SYMBOL}`);
    return Number(res.data.data.closing_price);
  } catch (err) {
    console.error("❌ 빗썸 API 오류:", err.message);
    return null;
  }
}

// ===== 로그 저장 =====
function saveLog(price, diffText) {
  const now = new Date().toLocaleString();
  const line = `[${now}] ${COIN_SYMBOL}: ${price.toLocaleString()}원 ${diffText}\n`;
  fs.appendFileSync(LOG_FILE, line, "utf-8");
  console.log(line.trim());
  return line;
}

// ===== GPT 리포트 생성 =====
async function callGPTReport(logSnippet) {
  if (!GPT_KEY) {
    console.log("⚠️ GPT API 키가 설정되지 않았습니다 (.env 파일 확인).");
    return;
  }

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "너는 전문 투자 리포트 분석가야." },
          {
            role: "user",
            content: `다음 로그 데이터를 기반으로 투자 인사이트를 3줄 요약으로 작성해줘:\n${logSnippet}`,
          },
        ],
        max_tokens: 200,
      },
      {
        headers: {
          Authorization: `Bearer ${GPT_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const report = `[${new Date().toLocaleString()}]\n${response.data.choices[0].message.content}\n\n`;
    fs.appendFileSync(REPORT_FILE, report, "utf-8");
    console.log("📈 GPT 리포트 생성 완료!");
  } catch (err) {
    console.error("⚠️ GPT 리포트 오류:", err.message);
  }
}

// ===== 일간 통계 요약 =====
function generateDailySummary() {
  try {
    if (!fs.existsSync(LOG_FILE)) return;
    const logs = fs.readFileSync(LOG_FILE, "utf-8").split("\n").filter(Boolean);
    const today = new Date().toLocaleDateString();
    const todayLogs = logs.filter((line) => line.includes(today));
    if (todayLogs.length === 0) return;

    const prices = todayLogs
      .map((line) => {
        const match = line.match(/: ([0-9,]+)원/);
        return match ? Number(match[1].replace(/,/g, "")) : null;
      })
      .filter(Boolean);

    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    const max = Math.max(...prices);
    const min = Math.min(...prices);
    const diff = ((max - min) / min) * 100;

    const summary = `
📅 ${today} 일간 요약
--------------------------
평균가: ${avg.toLocaleString()}원
최고가: ${max.toLocaleString()}원
최저가: ${min.toLocaleString()}원
변동률: ${diff.toFixed(2)}%
--------------------------
`;

    fs.appendFileSync(DAILY_FILE, summary, "utf-8");
    console.log("✅ 일간 통계 요약 생성 완료!");
  } catch (err) {
    console.error("⚠️ 통계 요약 오류:", err.message);
  }
}

// ===== 메인 실행 =====
async function main() {
  const price = await getPrice();
  if (!price) return;

  let diffText = "";
  if (lastPrice) {
    const diff = price - lastPrice;
    const rate = ((diff / lastPrice) * 100).toFixed(2);
    diffText = diff >= 0 ? `▲ +${rate}% 상승` : `▼ ${rate}% 하락`;
  } else {
    diffText = "(첫 데이터)";
  }

  lastPrice = price;
  const logLine = saveLog(price, diffText);

  // 병렬 실행
  callGPTReport(logLine);
  generateDailySummary();
}

// ===== 자동 루프 =====
setInterval(main, INTERVAL_MIN * 60 * 1000);
main();
