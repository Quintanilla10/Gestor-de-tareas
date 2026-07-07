/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface GmailMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
  isUnread: boolean;
}

// Fetch message details for a specific message ID
async function fetchMessageDetails(id: string, accessToken: string): Promise<GmailMessage | null> {
  try {
    const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    const data = await res.json();

    const headers = data.payload?.headers || [];
    const subjectHeader = headers.find((h: any) => h.name.toLowerCase() === 'subject');
    const fromHeader = headers.find((h: any) => h.name.toLowerCase() === 'from');
    const dateHeader = headers.find((h: any) => h.name.toLowerCase() === 'date');

    const subject = subjectHeader ? subjectHeader.value : '(Sin Asunto)';
    const from = fromHeader ? fromHeader.value : 'Desconocido';
    const date = dateHeader ? dateHeader.value : '';
    const snippet = data.snippet || '';
    const isUnread = data.labelIds?.includes('UNREAD') || false;

    return {
      id,
      threadId: data.threadId,
      subject,
      from,
      date,
      snippet,
      isUnread,
    };
  } catch (error) {
    console.error(`Error fetching message details for ${id}:`, error);
    return null;
  }
}

// Fetch the latest 10 unread or general emails from the inbox
export async function fetchLatestEmails(accessToken: string, unreadOnly = false): Promise<GmailMessage[]> {
  try {
    const q = unreadOnly ? 'is:unread category:primary' : 'category:primary';
    const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10${q ? `&q=${encodeURIComponent(q)}` : ''}`;
    
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error?.message || 'Error al obtener la lista de correos.');
    }

    const data = await res.json();
    if (!data.messages || data.messages.length === 0) {
      return [];
    }

    // Fetch details for all 10 messages in parallel
    const detailPromises = data.messages.map((m: { id: string }) => fetchMessageDetails(m.id, accessToken));
    const results = await Promise.all(detailPromises);
    
    // Filter out nulls
    return results.filter((m): m is GmailMessage => m !== null);
  } catch (error) {
    console.error('Error fetching latest emails:', error);
    throw error;
  }
}

// Mark an email message as read
export async function markEmailAsRead(id: string, accessToken: string): Promise<boolean> {
  try {
    const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}/modify`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        removeLabelIds: ['UNREAD'],
      }),
    });
    return res.ok;
  } catch (error) {
    console.error(`Error marking message ${id} as read:`, error);
    return false;
  }
}

// Send an email report (raw MIME encoded in base64url)
export async function sendEmailReport(
  accessToken: string,
  to: string,
  subject: string,
  htmlContent: string
): Promise<boolean> {
  try {
    // Construct robust MIME message
    const emailLines = [
      `To: ${to}`,
      `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      '',
      htmlContent,
    ];
    
    const mimeString = emailLines.join('\r\n');
    
    // base64url encoding
    const base64Encoded = btoa(unescape(encodeURIComponent(mimeString)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw: base64Encoded,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error?.message || 'Error al enviar el correo.');
    }

    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}
