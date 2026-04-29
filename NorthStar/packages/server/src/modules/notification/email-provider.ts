/**
 * 邮件 provider 抽象层。
 * Dev provider 写投递记录到内存，不依赖真实邮件服务。
 * SMTP provider 通过环境变量配置，连接真实 SMTP 服务器。
 */

export interface EmailMessage {
  to: string;
  subject: string;
  body: string;
  template?: "application_result" | "invite_link" | "password_reset";
}

export interface EmailDeliveryRecord {
  id: string;
  to: string;
  subject: string;
  status: "sent" | "failed";
  provider: string;
  error?: string;
  createdAt: string;
}

export interface EmailProvider {
  name: string;
  send(message: EmailMessage): Promise<{ success: boolean; error?: string }>;
}

// --- Dev Provider（开发环境使用）---

const deliveryLog: EmailDeliveryRecord[] = [];
let deliveryIdCounter = 0;

export const devEmailProvider: EmailProvider = {
  name: "dev",

  async send(message: EmailMessage) {
    const record: EmailDeliveryRecord = {
      id: String(++deliveryIdCounter),
      to: message.to,
      subject: message.subject,
      status: "sent",
      provider: "dev",
      createdAt: new Date().toISOString(),
    };

    deliveryLog.push(record);
    return { success: true };
  },
};

export function listDevDeliveryLog(): EmailDeliveryRecord[] {
  return [...deliveryLog];
}

export function clearDevDeliveryLog() {
  deliveryLog.length = 0;
}

// --- SMTP Provider（生产环境使用）---

interface SMTPConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
}

function getSMTPConfig(): SMTPConfig | null {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM;

  if (!host || !port || !user || !pass || !from) {
    return null;
  }

  return {
    host,
    port: parseInt(port, 10),
    user,
    pass,
    from,
  };
}

/**
 * 简单 SMTP 客户端，支持 TLS 和 PLAIN 认证
 * 使用 Node.js 内置 net 模块实现
 */
async function sendViaSMTP(
  config: SMTPConfig,
  message: EmailMessage,
): Promise<{ success: boolean; error?: string }> {
  const net = await import("node:net");
  const tls = await import("node:tls");

  return new Promise((resolve) => {
    const socket = new net.Socket();
    const buffer: Buffer[] = [];
    let step = 0;
    const responseLines: string[] = [];

    const STEPS = {
      CONNECT: 0,
      EHLO: 1,
      STARTTLS: 2,
      TLS_HANDSHAKE: 3,
      AUTH: 4,
      MAIL_FROM: 5,
      RCPT_TO: 6,
      DATA: 7,
      CONTENT: 8,
      QUIT: 9,
    };

    const commands = [
      `EHLO ${config.host}\r\n`,
      "STARTTLS\r\n",
      "",
      `AUTH PLAIN ${Buffer.from(`\0${config.user}\0${config.pass}`).toString("base64")}\r\n`,
      `MAIL FROM:<${config.from}>\r\n`,
      `RCPT TO:<${message.to}>\r\n`,
      "DATA\r\n",
      `From: ${config.from}\r\nTo: ${message.to}\r\nSubject: ${message.subject}\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n${message.body}\r\n.\r\n`,
      "QUIT\r\n",
    ];

    socket.setTimeout(30000);

    socket.on("connect", () => {
      console.log(`[SMTP] Connected to ${config.host}:${config.port}`);
    });

    socket.on("data", (data: Buffer) => {
      buffer.push(data);
      const response = data.toString();
      responseLines.push(response);

      // 检查是否完整行（以 \r\n 结尾）
      const fullResponse = Buffer.concat(buffer).toString();
      if (!fullResponse.includes("\r\n")) return;

      buffer.length = 0;
      const code = parseInt(fullResponse.substring(0, 3), 10);

      console.log(`[SMTP] Response: ${fullResponse.trim()}`);

      // 处理错误响应
      if (code >= 400 && step < STEPS.QUIT) {
        socket.destroy();
        resolve({
          success: false,
          error: `SMTP error ${code}: ${fullResponse.substring(4).trim()}`,
        });
        return;
      }

      // 执行下一步
      step++;

      if (step === STEPS.STARTTLS && code === 220) {
        // 升级到 TLS
        const tlsSocket = tls.connect({
          socket,
          host: config.host,
          rejectUnauthorized: false,
        });

        tlsSocket.on("data", (tlsData: Buffer) => {
          socket.emit("data", tlsData);
        });

        tlsSocket.on("error", (err) => {
          socket.destroy();
          resolve({ success: false, error: `TLS error: ${err.message}` });
        });

        step = STEPS.TLS_HANDSHAKE;
        return;
      }

      if (step < commands.length) {
        const cmd = commands[step];
        if (cmd) {
          console.log(`[SMTP] Command: ${cmd.trim()}`);
          socket.write(cmd);
        }
      }

      if (step === STEPS.QUIT) {
        socket.destroy();
        resolve({ success: true });
      }
    });

    socket.on("timeout", () => {
      socket.destroy();
      resolve({ success: false, error: "SMTP connection timeout" });
    });

    socket.on("error", (err: Error) => {
      console.error(`[SMTP] Socket error: ${err.message}`);
      resolve({ success: false, error: err.message });
    });

    socket.connect(config.port, config.host);
  });
}

export const smtpEmailProvider: EmailProvider = {
  name: "smtp",

  async send(message: EmailMessage) {
    const config = getSMTPConfig();
    if (!config) {
      return { success: false, error: "SMTP configuration incomplete" };
    }

    console.log(`[SMTP] Sending email to ${message.to}: ${message.subject}`);

    // 尝试发送，失败时重试一次
    let result = await sendViaSMTP(config, message);

    if (!result.success) {
      console.warn(`[SMTP] First attempt failed: ${result.error}, retrying...`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      result = await sendViaSMTP(config, message);
    }

    if (result.success) {
      console.log(`[SMTP] Email sent successfully to ${message.to}`);
    } else {
      console.error(`[SMTP] Failed to send email after retry: ${result.error}`);
    }

    return result;
  },
};

// --- Provider 选择 ---

let currentProvider: EmailProvider = devEmailProvider;

export function getEmailProvider(): EmailProvider {
  return currentProvider;
}

export function setEmailProvider(provider: EmailProvider) {
  currentProvider = provider;
}

/**
 * 初始化邮件 provider
 * 如果配置了 SMTP 环境变量则使用 SMTP，否则使用 dev provider
 */
export function initEmailProvider() {
  const smtpConfig = getSMTPConfig();
  if (smtpConfig) {
    console.log(`[Email] Using SMTP provider: ${smtpConfig.host}:${smtpConfig.port}`);
    currentProvider = smtpEmailProvider;
  } else {
    console.log("[Email] SMTP not configured, using dev provider");
    currentProvider = devEmailProvider;
  }
}

// --- 便捷发送 ---

export async function sendEmail(message: EmailMessage): Promise<EmailDeliveryRecord> {
  const provider = getEmailProvider();
  const maxRetries = 3;
  let lastResult: { success: boolean; error?: string } | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    lastResult = await provider.send(message);
    if (lastResult.success) break;

    // 记录重试到投递日志
    if (attempt < maxRetries) {
      const retryRecord: EmailDeliveryRecord = {
        id: String(++deliveryIdCounter),
        to: message.to,
        subject: message.subject,
        status: "failed",
        provider: provider.name,
        error: `重试 ${attempt}/${maxRetries - 1}: ${lastResult.error ?? "未知错误"}`,
        createdAt: new Date().toISOString(),
      };
      deliveryLog.push(retryRecord);
    }
  }

  const record: EmailDeliveryRecord = {
    id: String(++deliveryIdCounter),
    to: message.to,
    subject: message.subject,
    status: lastResult!.success ? "sent" : "failed",
    provider: provider.name,
    error: lastResult!.success ? undefined : `重试 ${maxRetries} 次后仍失败: ${lastResult!.error ?? "未知错误"}`,
    createdAt: new Date().toISOString(),
  };

  deliveryLog.push(record);
  return record;
}
