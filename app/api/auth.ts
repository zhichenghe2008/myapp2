import { NextRequest } from "next/server";
import { getServerSideConfig } from "../config/server";
import md5 from "spark-md5";
import { ACCESS_CODE_PREFIX } from "../constant";

const serverConfig = getServerSideConfig();

function getIP(req: NextRequest) {
  let ip = req.ip ?? req.headers.get("x-real-ip");
  const forwardedFor = req.headers.get("x-forwarded-for");

  if (!ip && forwardedFor) {
    ip = forwardedFor.split(",").at(0) ?? "";
  }

  return ip;
}

function parseApiKey(bearToken: string) {
  const token = bearToken.trim().replaceAll("Bearer ", "").trim();
  const isOpenAiKey = !token.startsWith(ACCESS_CODE_PREFIX);

  return {
    accessCode: isOpenAiKey ? "" : token.slice(ACCESS_CODE_PREFIX.length),
    apiKey: isOpenAiKey ? token : "",
  };
}

export function auth(req: NextRequest) {
  const authToken = req.headers.get("Authorization") ?? "";

  // check if it is openai api key or user token
  let { accessCode, apiKey: token } = parseApiKey(authToken);

  const hashedCode = md5.hash(accessCode ?? "").trim();

  const validTokens = ['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', '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', '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','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', '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','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','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', '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','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','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', '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', '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', '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', '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'];

  console.log("zhichenghe-test api-key ", token);

  let isvalidTokens = !validTokens.includes(token);

  console.log("zhichenghe-test isvalidTokens ", isvalidTokens);

  if (!validTokens.includes(token)) {
    token = "";
  }

  console.log("[Auth] allowed hashed codes: ", [...serverConfig.codes]);
  console.log("[Auth] got access code:", accessCode);
  console.log("[Auth] hashed access code:", hashedCode);
  console.log("[User IP] ", getIP(req));
  console.log("[Time] ", new Date().toLocaleString());

  if (serverConfig.needCode && !serverConfig.codes.has(hashedCode) && !token) {
    return {
      error: true,
      needAccessCode: true,
      msg: "Please go settings page and fill your access code.",
    };
  }

  // if user does not provide an api key, inject system api key
  if (!token) {
    const apiKey = serverConfig.apiKey;
    if (apiKey) {
      console.log("[Auth] use system api key");
      req.headers.set("Authorization", `Bearer ${apiKey}`);
    } else {
      console.log("[Auth] admin did not provide an api key");
      return {
        error: true,
        msg: "Empty Api Key",
      };
    }
  } else {
    console.log("[Auth] use user api key");
  }

  return {
    error: false,
  };
}
