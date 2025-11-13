import { Client } from '@line/bot-sdk';
import { config } from '../config.js';
import { getClinicByChannelId } from '../db/queries.js';

const client = new Client(config.line);

interface BookingData {
  clinicId: string;
  channelId: string;
  customerName: string;
  customerPhone: string;
  appointmentDate: string;
  appointmentTime: string;
  treatment: string;
  doctor?: string;
  notes?: string;
}

/**
 * Send booking confirmation to LINE group
 * This function is called after a booking is successfully created
 */
export async function sendBookingConfirmation(bookingData: BookingData): Promise<void> {
  try {
    const { channelId, customerName, customerPhone, appointmentDate, appointmentTime, treatment, doctor, notes } = bookingData;

    // Create Flex Message for booking confirmation
    const flexMessage = {
      type: 'flex',
      altText: `預約確認 - ${customerName}`,
      contents: {
        type: 'bubble',
        size: 'mega',
        header: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'text',
                  text: '✅ 預約成功',
                  color: '#ffffff',
                  size: 'xl',
                  weight: 'bold',
                },
                {
                  type: 'text',
                  text: '已收到您的預約申請',
                  color: '#ffffff',
                  size: 'sm',
                  margin: 'sm',
                },
              ],
            },
          ],
          paddingAll: '20px',
          backgroundColor: '#1e3a8a',
          spacing: 'md',
        },
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'box',
              layout: 'vertical',
              margin: 'lg',
              spacing: 'sm',
              contents: [
                {
                  type: 'box',
                  layout: 'baseline',
                  spacing: 'sm',
                  contents: [
                    {
                      type: 'text',
                      text: '姓名',
                      color: '#aaaaaa',
                      size: 'sm',
                      flex: 2,
                    },
                    {
                      type: 'text',
                      text: customerName,
                      wrap: true,
                      color: '#666666',
                      size: 'sm',
                      flex: 5,
                      weight: 'bold',
                    },
                  ],
                },
                {
                  type: 'box',
                  layout: 'baseline',
                  spacing: 'sm',
                  contents: [
                    {
                      type: 'text',
                      text: '電話',
                      color: '#aaaaaa',
                      size: 'sm',
                      flex: 2,
                    },
                    {
                      type: 'text',
                      text: customerPhone,
                      wrap: true,
                      color: '#666666',
                      size: 'sm',
                      flex: 5,
                    },
                  ],
                },
                {
                  type: 'box',
                  layout: 'baseline',
                  spacing: 'sm',
                  contents: [
                    {
                      type: 'text',
                      text: '日期',
                      color: '#aaaaaa',
                      size: 'sm',
                      flex: 2,
                    },
                    {
                      type: 'text',
                      text: appointmentDate,
                      wrap: true,
                      color: '#666666',
                      size: 'sm',
                      flex: 5,
                      weight: 'bold',
                    },
                  ],
                },
                {
                  type: 'box',
                  layout: 'baseline',
                  spacing: 'sm',
                  contents: [
                    {
                      type: 'text',
                      text: '時間',
                      color: '#aaaaaa',
                      size: 'sm',
                      flex: 2,
                    },
                    {
                      type: 'text',
                      text: appointmentTime,
                      wrap: true,
                      color: '#666666',
                      size: 'sm',
                      flex: 5,
                      weight: 'bold',
                    },
                  ],
                },
                {
                  type: 'box',
                  layout: 'baseline',
                  spacing: 'sm',
                  contents: [
                    {
                      type: 'text',
                      text: '療程',
                      color: '#aaaaaa',
                      size: 'sm',
                      flex: 2,
                    },
                    {
                      type: 'text',
                      text: treatment,
                      wrap: true,
                      color: '#666666',
                      size: 'sm',
                      flex: 5,
                    },
                  ],
                },
              ],
            },
          ],
        },
        footer: {
          type: 'box',
          layout: 'vertical',
          spacing: 'sm',
          contents: [
            {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'text',
                  text: '診所人員將盡快與您聯繫確認',
                  size: 'xs',
                  color: '#999999',
                  align: 'center',
                },
              ],
            },
          ],
          flex: 0,
        },
      },
    };

    // Add doctor if specified
    if (doctor) {
      const bodyContents = (flexMessage.contents.body.contents[0] as any).contents;
      bodyContents.push({
        type: 'box',
        layout: 'baseline',
        spacing: 'sm',
        contents: [
          {
            type: 'text',
            text: '醫師',
            color: '#aaaaaa',
            size: 'sm',
            flex: 2,
          },
          {
            type: 'text',
            text: doctor,
            wrap: true,
            color: '#666666',
            size: 'sm',
            flex: 5,
          },
        ],
      });
    }

    // Add notes if specified
    if (notes) {
      const bodyContents = (flexMessage.contents.body.contents[0] as any).contents;
      bodyContents.push({
        type: 'box',
        layout: 'baseline',
        spacing: 'sm',
        contents: [
          {
            type: 'text',
            text: '備註',
            color: '#aaaaaa',
            size: 'sm',
            flex: 2,
          },
          {
            type: 'text',
            text: notes,
            wrap: true,
            color: '#666666',
            size: 'sm',
            flex: 5,
          },
        ],
      });
    }

    // Push message to group
    await client.pushMessage(channelId, flexMessage as any);
    console.log(`✅ Booking confirmation sent to channel: ${channelId}`);
  } catch (error) {
    console.error('❌ Error sending booking confirmation:', error);
    throw error;
  }
}
