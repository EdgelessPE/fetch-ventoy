import { readerFromStreamReader } from "https://deno.land/std/io/mod.ts";
import { existsSync } from "https://deno.land/std/fs/mod.ts";

let PATH = "/hdisk/edgeless/Socket/Ventoy/";

//https://github.com/ventoy/Ventoy/releases/download/v1.0.46/ventoy-1.0.46-windows.zip
async function getAddr() {
  //配置Headers
  const header = new Headers();
  header.append("Accept", "application/vnd.github.v3+json");

  //获得Response
  const response = await fetch(
    "https://api.github.com/repos/ventoy/Ventoy/releases/latest",
    { headers: header }
  );

  //获得data
  const data = await response.json();

  //遍历data的assets获得windows版下载地址
  let result = "";
  for (const key in data.assets) {
    const addr = data.assets[key].browser_download_url as string;
    if (addr.includes("windows")) result = addr;
  }

  return result;
}

function _parseVersion(url: string): string {
  const versionMatch = url.match(/ventoy-[.\d]+/);
  if (versionMatch) {
    return versionMatch[0].split("-")[1];
  } else {
    return "0.0.0";
  }
}

function parseFileName(url: string): string {
  const splitRes = url.split("/");
  return splitRes[splitRes.length - 1];
}

async function downloadFile(url: string, filename: string) {
  const rsp = await fetch(url);
  const rdr = rsp.body?.getReader();
  if (rdr) {
    const r = readerFromStreamReader(rdr);
    const f = await Deno.open(PATH + filename, { create: true, write: true });
    await Deno.copy(r, f);
    f.close();
  }
}

function needUpdate(filename: string): boolean {
  return !existsSync(PATH + filename);
}

async function main() {
  //根据环境判断PATH位置
  if (!existsSync(PATH)) PATH = "./";

  //获取url
  const url = await getAddr();

  //解析文件名
  const name = parseFileName(url);

  //判断是否需要更新
  if (needUpdate(name)) {
    //下载文件
    console.log("Start downloading " + name);
    downloadFile(url, name);
  } else {
    console.log("Has been up to date");
  }
}

main();
