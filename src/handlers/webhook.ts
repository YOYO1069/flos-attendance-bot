import { WebhookEvent, MessageEvent, TextMessage } from '@line/bot-sdk';
import { handleTextMessage } from './message.js';

export async function handleWebhook(event: WebhookEvent): Promise<void> {
  console.log('📨 Received event:', event.type);

  try {
    switch (event.type) {
      case 'message':
        await handleMessageEvent(event);
        break;
      
      case 'follow':
        console.log('👤 User followed:', event.source.userId);
        break;
      
      case 'unfollow':
        console.log('👋 User unfollowed:', event.source.userId);
        break;
      
      default:
        console.log('ℹ️ Unhandled event type:', event.type);
    }
  } catch (error) {
    console.error('❌ Error handling webhook:', error);
  }
}

async function handleMessageEvent(event: MessageEvent): Promise<void> {
  if (event.message.type === 'text') {
    const textMessage = event.message as TextMessage;
    await handleTextMessage(event, textMessage.text);
  } else {
    console.log('ℹ️ Non-text message received:', event.message.type);
  }
}
