import { MessageEvent, Client } from '@line/bot-sdk';
import { config } from '../config.js';
import {
  getClinicByChannelId,
  getEmployeeByLineUserId,
  createEmployee,
  getTodayAttendance,
  checkIn,
  checkOut,
} from '../db/queries.js';

const client = new Client(config.line);

export async function handleTextMessage(
  event: MessageEvent,
  text: string
): Promise<void> {
  const userId = event.source.userId;
  if (!userId) {
    console.log('⚠️ No user ID in event');
    return;
  }

  const trimmedText = text.trim();
  console.log(`💬 Message from ${userId}: ${trimmedText}`);

  // Get clinic info from group/room
  const channelId = getChannelId(event);
  if (!channelId) {
    await replyMessage(event.replyToken, '此功能僅限在群組或聊天室中使用');
    return;
  }

  const clinic = await getClinicByChannelId(channelId);
  if (!clinic) {
    console.error(`❌ Clinic not found for channel: ${channelId}`);
    await replyMessage(event.replyToken, '找不到診所資訊，請聯絡管理員');
    return;
  }

  console.log(`🏥 Clinic: ${clinic.name} (ID: ${clinic.id})`);

  // Handle commands
  if (trimmedText.startsWith('員工綁定')) {
    await handleEmployeeBinding(event, userId, clinic.id, trimmedText);
  } else if (trimmedText === '打卡上班' || trimmedText === '上班打卡') {
    await handleCheckIn(event, userId);
  } else if (trimmedText === '打卡下班' || trimmedText === '下班打卡') {
    await handleCheckOut(event, userId);
  } else if (trimmedText === '查詢打卡') {
    await handleCheckStatus(event, userId);
  } else {
    // Unknown command
    console.log('ℹ️ Unknown command:', trimmedText);
  }
}

function getChannelId(event: MessageEvent): string | null {
  if (event.source.type === 'group') {
    return event.source.groupId || null;
  } else if (event.source.type === 'room') {
    return event.source.roomId || null;
  }
  return null;
}

async function handleEmployeeBinding(
  event: MessageEvent,
  userId: string,
  clinicId: number,
  text: string
): Promise<void> {
  // Parse: 員工綁定 ADMIN-CODE 姓名
  const parts = text.split(/\s+/);
  
  if (parts.length < 3) {
    await replyMessage(
      event.replyToken,
      '格式錯誤！請使用：員工綁定 授權碼 姓名\n例如：員工綁定 ADMIN-HBH012 王小明'
    );
    return;
  }

  const authCode = parts[1];
  const name = parts.slice(2).join(' ');

  // Verify auth code
  if (authCode !== config.admin.authCode) {
    await replyMessage(event.replyToken, '❌ 授權碼錯誤');
    return;
  }

  // Check if already bound
  const existing = await getEmployeeByLineUserId(userId);
  if (existing) {
    await replyMessage(
      event.replyToken,
      `您已經綁定為：${existing.name}\n如需更改請聯絡管理員`
    );
    return;
  }

  // Create employee
  const employee = await createEmployee(clinicId, userId, name);
  if (!employee) {
    await replyMessage(event.replyToken, '❌ 綁定失敗，請稍後再試');
    return;
  }

  await replyMessage(
    event.replyToken,
    `✅ 員工綁定成功！\n姓名：${name}\n\n您現在可以使用以下指令：\n• 打卡上班\n• 打卡下班\n• 查詢打卡`
  );
}

async function handleCheckIn(event: MessageEvent, userId: string): Promise<void> {
  const employee = await getEmployeeByLineUserId(userId);
  if (!employee) {
    await replyMessage(event.replyToken, '❌ 您尚未綁定員工資料，請先使用「員工綁定」指令');
    return;
  }

  // Check if already checked in today
  const todayRecord = await getTodayAttendance(employee.id);
  if (todayRecord && !todayRecord.check_out_time) {
    const checkInTime = new Date(todayRecord.check_in_time).toLocaleTimeString('zh-TW', {
      hour: '2-digit',
      minute: '2-digit',
    });
    await replyMessage(
      event.replyToken,
      `您今天已經打卡上班了\n上班時間：${checkInTime}`
    );
    return;
  }

  // Check in
  const record = await checkIn(employee.id);
  if (!record) {
    await replyMessage(event.replyToken, '❌ 打卡失敗，請稍後再試');
    return;
  }

  const checkInTime = new Date(record.check_in_time).toLocaleTimeString('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
  });

  await replyMessage(
    event.replyToken,
    `✅ 上班打卡成功！\n姓名：${employee.name}\n時間：${checkInTime}`
  );
}

async function handleCheckOut(event: MessageEvent, userId: string): Promise<void> {
  const employee = await getEmployeeByLineUserId(userId);
  if (!employee) {
    await replyMessage(event.replyToken, '❌ 您尚未綁定員工資料，請先使用「員工綁定」指令');
    return;
  }

  // Get today's record
  const todayRecord = await getTodayAttendance(employee.id);
  if (!todayRecord) {
    await replyMessage(event.replyToken, '❌ 您今天尚未打卡上班');
    return;
  }

  if (todayRecord.check_out_time) {
    const checkOutTime = new Date(todayRecord.check_out_time).toLocaleTimeString('zh-TW', {
      hour: '2-digit',
      minute: '2-digit',
    });
    await replyMessage(
      event.replyToken,
      `您今天已經打卡下班了\n下班時間：${checkOutTime}`
    );
    return;
  }

  // Check out
  const record = await checkOut(todayRecord.id);
  if (!record) {
    await replyMessage(event.replyToken, '❌ 打卡失敗，請稍後再試');
    return;
  }

  const checkInTime = new Date(record.check_in_time).toLocaleTimeString('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const checkOutTime = new Date(record.check_out_time!).toLocaleTimeString('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Calculate work hours
  const duration = new Date(record.check_out_time!).getTime() - new Date(record.check_in_time).getTime();
  const hours = Math.floor(duration / (1000 * 60 * 60));
  const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));

  await replyMessage(
    event.replyToken,
    `✅ 下班打卡成功！\n姓名：${employee.name}\n上班：${checkInTime}\n下班：${checkOutTime}\n工時：${hours} 小時 ${minutes} 分鐘`
  );
}

async function handleCheckStatus(event: MessageEvent, userId: string): Promise<void> {
  const employee = await getEmployeeByLineUserId(userId);
  if (!employee) {
    await replyMessage(event.replyToken, '❌ 您尚未綁定員工資料，請先使用「員工綁定」指令');
    return;
  }

  const todayRecord = await getTodayAttendance(employee.id);
  if (!todayRecord) {
    await replyMessage(
      event.replyToken,
      `📋 今日打卡狀態\n姓名：${employee.name}\n狀態：尚未打卡`
    );
    return;
  }

  const checkInTime = new Date(todayRecord.check_in_time).toLocaleTimeString('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (!todayRecord.check_out_time) {
    await replyMessage(
      event.replyToken,
      `📋 今日打卡狀態\n姓名：${employee.name}\n上班：${checkInTime}\n狀態：上班中`
    );
    return;
  }

  const checkOutTime = new Date(todayRecord.check_out_time).toLocaleTimeString('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const duration = new Date(todayRecord.check_out_time).getTime() - new Date(todayRecord.check_in_time).getTime();
  const hours = Math.floor(duration / (1000 * 60 * 60));
  const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));

  await replyMessage(
    event.replyToken,
    `📋 今日打卡狀態\n姓名：${employee.name}\n上班：${checkInTime}\n下班：${checkOutTime}\n工時：${hours} 小時 ${minutes} 分鐘`
  );
}

async function replyMessage(replyToken: string, text: string): Promise<void> {
  try {
    await client.replyMessage(replyToken, {
      type: 'text',
      text: text,
    });
  } catch (error) {
    console.error('❌ Error replying message:', error);
  }
}
