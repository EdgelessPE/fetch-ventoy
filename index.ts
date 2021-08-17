import { readerFromStreamReader } from "https://deno.land/std/io/mod.ts";
import { existsSync } from "https://deno.land/std/fs/mod.ts";
import { copy } from "https://deno.land/std/io/util.ts";

const PATH = "/hdisk/edgeless/Socket/Ventoy";

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

async function downloadFile(url: string, filename: string): Promise<boolean> {
  const rsp = await fetch(url);
  const rdr = rsp.body?.getReader();
  if (rdr) {
    const r = readerFromStreamReader(rdr);
    const f = await Deno.open("./" + filename, { create: true, write: true });
    await copy(r, f);
    f.close();
  }

  return existsSync("./" + filename);
}

async function localExist(filename: string): Promise<boolean> {
  return await existsSync(PATH+"/"+filename);
}

async function localUpload(filename: string): Promise<boolean> {
  Deno.copyFileSync(filename,PATH+"/"+filename)
  return await existsSync(PATH+"/"+filename);
}

async function main() {
  //获取url
  const url = await getAddr();

  //解析文件名
  const name = parseFileName(url);

  //判断是否需要更新
  const need = await localExist(name);

  if (!need) {
    //下载文件
    console.log("Start downloading " + name);
    const downloadSuc = await downloadFile(url, name);
    if (!downloadSuc) {
      console.log("::error::Download failed,exit");
      return;
    }

    console.log("Start uploading " + name);
    const possiblePaths = [
      name,
      "./" + name,
      "../" + name,
      "./fetch-ventoy/" + name,
    ];
    let path = name;
    for (let i = 0; i < possiblePaths.length; i++) {
      if (existsSync(possiblePaths[i])) {
        path = possiblePaths[i];
        console.log("Change to " + path);
      }
    }
    const uploadRes = await localUpload(path);
    if (!uploadRes) {
      console.log("::error::Upload failed,exit");
      return;
    }
  } else {
    console.log("Has been up to date");
  }
}

main();
