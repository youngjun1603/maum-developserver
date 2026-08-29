# 마음풀 생태계 전용 AI egress 프록시 — 의존성 0, Node 내장만
FROM node:20-alpine
WORKDIR /app
COPY server.js .
ENV PORT=8080
EXPOSE 8080
# PROXY_SECRET 는 실행 시 환경변수로 주입(이미지에 굽지 않음)
CMD ["node", "server.js"]
