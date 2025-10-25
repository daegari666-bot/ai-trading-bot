# Dockerfile
# ---- Render용 Node.js 실행 설정 ----

# 1. Node 공식 이미지 사용
FROM node:20

# 2. 앱 폴더 생성
WORKDIR /app

# 3. 패키지 복사 및 설치
COPY package*.json ./
RUN npm install

# 4. 나머지 코드 복사
COPY . .

# 5. 환경 변수 (UTF-8 한글 깨짐 방지)
ENV LANG C.UTF-8

# 6. 앱 실행 명령
CMD ["node", "index_home_full.js"]
