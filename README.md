# FLOS Clinic LINE Bot - Attendance Management System

LINE Bot 考勤管理系統,專為 FLOS 曜診所設計。

## 功能特色

- ✅ 員工綁定 (使用授權碼)
- ✅ 上班打卡
- ✅ 下班打卡
- ✅ 查詢打卡狀態
- ✅ 自動計算工時
- ✅ Supabase 資料庫整合

## 技術架構

- **Runtime**: Node.js 20
- **Language**: TypeScript
- **Framework**: Express.js
- **LINE SDK**: @line/bot-sdk
- **Database**: Supabase (PostgreSQL)

## 環境變數

複製 `.env.example` 為 `.env` 並填入以下資訊:

```env
PORT=8080
LINE_CHANNEL_ACCESS_TOKEN=your_token_here
LINE_CHANNEL_SECRET=your_secret_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_key_here
ADMIN_AUTH_CODE=ADMIN-HBH012
```

## 本地開發

```bash
# 安裝依賴
npm install

# 開發模式 (熱重載)
npm run dev

# 建置
npm run build

# 生產模式
npm start
```

## 部署到 Zeabur

1. 建立新的 Zeabur 服務
2. 連接此 GitHub 倉庫
3. 設定環境變數
4. 部署完成後,將 Webhook URL 設定到 LINE Developers Console

Webhook URL: `https://your-domain.zeabur.app/webhook`

## LINE Bot 指令

### 員工綁定
```
員工綁定 ADMIN-HBH012 王小明
```

### 上班打卡
```
打卡上班
```
或
```
上班打卡
```

### 下班打卡
```
打卡下班
```
或
```
下班打卡
```

### 查詢打卡狀態
```
查詢打卡
```

## 資料庫結構

### clinics 表
- `id`: 診所 ID
- `name`: 診所名稱
- `linechannelid`: LINE Channel ID

### employees 表
- `id`: 員工 ID
- `clinic_id`: 診所 ID
- `line_user_id`: LINE User ID
- `name`: 員工姓名
- `is_active`: 是否啟用

### attendance_records 表
- `id`: 記錄 ID
- `employee_id`: 員工 ID
- `check_in_time`: 上班時間
- `check_out_time`: 下班時間
- `location`: 打卡地點 (選填)

## License

MIT
