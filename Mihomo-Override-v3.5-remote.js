/**
 * Mihomo / FlClash Override v3.5 Remote-Compatible
 *
 * 黑白极简几何风格
 *
 * 1. 保留订阅真实节点及原始连接参数
 * 2. 固定已确认节点地区映射
 * 3. 所有真实节点统一进入地区节点手动选择组
 * 4. 业务组支持选择地区节点或单个真实节点
 * 5. 不使用自动测速及负载均衡
 * 6. muse.ai 归入 AI 业务组
 * 7. Google Play 独立分流
 * 8. FCM 推送独立分流
 * 9. Loyalsoldier 官方 13 个规则集
 * 10. Fake-IP DNS
 * 11. 黑白 SVG 几何图标
 * 12. 修复 no-resolve 完整性检查
 * 13. 兼容 3x-ui Remote Routing 注入的规则和规则集
 * 14. 完全沿用 v3.5 策略组结构，不接收远程 YAML 的策略组
 * 15. 远程 MATCH 由本脚本统一兜底，避免重复兜底
 */

function main(config) {
  if (!config || typeof config !== "object") throw new Error("配置无效");

  const SETTINGS = {
    "mixed-port": 7890, "allow-lan": false, "bind-address": "*",
    "mode": "rule", "log-level": "info", "unified-delay": true,
    "tcp-concurrent": true, "find-process-mode": "strict"
  };
  Object.keys(SETTINGS).forEach(key => { if (config[key] === undefined) config[key] = SETTINGS[key]; });
  if (config.ipv6 === undefined) config.ipv6 = false;
  if (!config.hosts || typeof config.hosts !== "object") config.hosts = {};

  // Capture 3x-ui Remote Routing additions before this override builds its own groups/rules.
  // If no remote routing is present, these arrays remain empty and v3.5 behavior is preserved.
  const REMOTE_RULES = Array.isArray(config.rules)
    ? config.rules.filter(rule => typeof rule === "string" && !/^MATCH\s*,/i.test(rule.trim()))
    : [];

  const GROUP = {
    region: "地区节点", domestic: "国内网站",
    international: "国际网站", fallback: "漏网之鱼", adblock: "广告拦截"
  };
  const FCM_GROUP = "FCM 推送";
  // 域名白名单：添加确有误拦截的域名，优先于广告规则并直连放行。
  const AD_WHITELIST = [
    // "example.com"
  ];

  const REGION_MAP = {
    "HY2-HY2": "美国", "RAKSmart": "美国", "isvoro-9929": "美国",
    "闪盾-洛杉矶": "美国", "洛杉矶": "美国",
    "EVOXT": "马来西亚",
    "阿里云-Alibaba-HK": "香港", "阿里云-香港": "香港",
    "SHANDUN-shandunhk": "香港", "闪盾-香港": "香港",
    "GUANGDUN": "德国", "CST": "德国", "闪盾-法兰克福": "德国",
    "法兰克福": "德国"
  };

  function makeIcon(type) {
    const common = 'fill="none" stroke="#111111" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"';
    const shapes = {
      region: '<circle cx="32" cy="32" r="23"/><path d="M9 32h46M32 9c8 8 8 38 0 46M32 9c-8 8-8 38 0 46"/>',
      domestic: '<path d="M8 30 32 10l24 20M15 27v27h34V27M27 54V38h10v16"/>',
      international: '<circle cx="32" cy="32" r="23"/><path d="M9 32h46M32 9c8 8 8 38 0 46M32 9c-8 8-8 38 0 46"/>',
      fallback: '<path d="M8 34c10-17 29-20 45-8l7 6-7 6C37 50 18 47 8 34Z"/><circle cx="23" cy="30" r="2"/>',
      adblock: '<path d="M32 7 53 15v16c0 14-9 23-21 28C20 54 11 45 11 31V15Z"/><path d="m21 21 22 22"/>',
      fcm: '<path d="M18 43h28l-4-6V27a10 10 0 0 0-20 0v10Z"/><path d="M27 49a5 5 0 0 0 10 0M32 10v5"/>',
      youtube: '<rect x="8" y="15" width="48" height="34" rx="9"/><path d="m27 24 15 8-15 8Z"/>',
      ai: '<path d="M32 7 37 24 54 18 44 33 57 43 38 42 32 58 26 42 7 43 20 33 10 18 27 24Z"/><circle cx="32" cy="33" r="5"/>',
      github: '<path d="M20 51c-9-4-12-12-10-22 2-12 12-19 22-19s20 7 22 19c2 10-1 18-10 22"/><path d="M22 50v-9c-6 1-9-2-10-6M42 50v-9c6 1 9-2 10-6"/>',
      microsoft: '<rect x="10" y="10" width="19" height="19"/><rect x="35" y="10" width="19" height="19"/><rect x="10" y="35" width="19" height="19"/><rect x="35" y="35" width="19" height="19"/>',
      apple: '<path d="M32 20c-8-10-22-2-20 14 2 13 10 22 17 18 3-2 5-2 8 0 7 4 15-5 17-18 2-16-12-24-22-14Z"/><path d="M34 17c0-7 5-11 12-12"/>',
      telegram: '<path d="m7 30 48-19-11 43-14-12-9 9-1-16Z"/><path d="m20 35 35-24"/>',
      twitter: '<path d="M12 12 52 52M52 12 12 52"/>',
      meta: '<path d="M8 39c8-28 18-29 24-7 6 22 16 21 24-7"/><path d="M8 39c8 15 17 14 24-7 7-21 16-22 24-7"/>',
      tiktok: '<path d="M37 10v29a10 10 0 1 1-10-10"/><path d="M37 10c2 8 7 12 15 13"/>',
      netflix: '<rect x="12" y="9" width="40" height="46" rx="3"/><path d="M23 49V15l18 34V15"/>',
      disney: '<path d="M8 42c10-25 28-31 48-17M19 47c10-10 22-12 35-5"/><path d="m32 7 3 8 8 3-8 3-3 8-3-8-8-3 8-3Z"/>',
      spotify: '<circle cx="32" cy="32" r="24"/><path d="M17 25c11-4 23-3 32 2M19 33c9-3 19-2 27 2M22 41c7-2 14-1 20 2"/>',
      steam: '<circle cx="32" cy="32" r="22"/><circle cx="40" cy="24" r="8"/><circle cx="21" cy="42" r="6"/><path d="m26 39 8-10"/>',
      emby: '<rect x="9" y="12" width="46" height="34" rx="4"/><path d="M24 54h16M32 46v8"/>',
      pikpak: '<path d="M13 44a10 10 0 0 1 2-20 17 17 0 0 1 33 3 9 9 0 0 1 1 18Z"/><path d="M25 34h14M32 27v14"/>',
      paypal: '<path d="M18 53 26 11h20c10 0 13 7 10 16-3 10-10 14-20 14H25"/>',
      crypto: '<circle cx="32" cy="32" r="23"/><path d="M25 17h13a7 7 0 0 1 0 14H25h14a8 8 0 0 1 0 16H25M31 12v40"/>'
    };
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><g ' + common + '>' + (shapes[type] || shapes.region) + '</g></svg>';
    return "data:image/svg+xml," + encodeURIComponent(svg);
  }

  const ICONS = {
    region: makeIcon("region"), domestic: makeIcon("domestic"),
    international: makeIcon("international"), fallback: makeIcon("fallback"),
    adblock: makeIcon("adblock"), fcm: makeIcon("fcm"),
    YouTube: makeIcon("youtube"), AI: makeIcon("ai"),
    GitHub: makeIcon("github"), Microsoft: makeIcon("microsoft"),
    Apple: makeIcon("apple"), Telegram: makeIcon("telegram"),
    Twitter: makeIcon("twitter"), Meta: makeIcon("meta"),
    TikTok: makeIcon("tiktok"), Netflix: makeIcon("netflix"),
    "Disney+": makeIcon("disney"), Spotify: makeIcon("spotify"),
    Steam: makeIcon("steam"), Emby: makeIcon("emby"),
    PikPak: makeIcon("pikpak"), PayPal: makeIcon("paypal"),
    加密货币: makeIcon("crypto")
  };

  const SERVICES = {
    YouTube: ["youtube.com","youtu.be","ytimg.com","youtube-nocookie.com","googlevideo.com","ggpht.com"],
    AI: ["openai.com","chatgpt.com","oaistatic.com","oaiusercontent.com","anthropic.com","claude.ai","claudeusercontent.com","gemini.google.com","generativelanguage.googleapis.com","aistudio.google.com","ai.google.dev","copilot.microsoft.com","perplexity.ai","poe.com","huggingface.co","meta.ai","muse.ai"],
    GitHub: ["github.com","githubusercontent.com","githubassets.com","github.io","github.dev","github.blog","raw.githubusercontent.com","objects.githubusercontent.com"],
    Microsoft: ["microsoft.com","microsoftonline.com","microsoft365.com","office.com","office.net","live.com","outlook.com","windows.com","windowsupdate.com","xbox.com","xboxlive.com","bing.com","msn.com","onedrive.com","sharepoint.com","azure.com","visualstudio.com"],
    Apple: ["apple.com","icloud.com","icloud-content.com","mzstatic.com","apple-cloudkit.com","apple-dns.net","itunes.com","itunes.apple.com","apps.apple.com"],
    Telegram: ["t.me","telegram.org","telegram.me","telegram.dog","telegra.ph","tdesktop.com"],
    Twitter: ["x.com","twitter.com","t.co","twimg.com","twittercdn.com"],
    Meta: ["facebook.com","facebook.net","fb.com","fbcdn.net","instagram.com","cdninstagram.com","threads.net","messenger.com","whatsapp.com","whatsapp.net"],
    TikTok: ["tiktok.com","tiktokv.com","tiktokcdn.com","tiktokcdn-us.com","byteoversea.com","ibytedtos.com","musical.ly","ttwstatic.com"],
    Netflix: ["netflix.com","netflix.net","nflxext.com","nflximg.com","nflximg.net","nflxvideo.net","nflxso.net","nflxsearch.net"],
    "Disney+": ["disneyplus.com","disney-plus.net","disneystreaming.com","bamgrid.com","dssott.com","starott.com"],
    Spotify: ["spotify.com","scdn.co","spotifycdn.com","spotifycdn.net","pscdn.co"],
    Steam: ["steampowered.com","steamcommunity.com","steamstatic.com","steamcontent.com","steam-chat.com","steamgames.com","steamusercontent.com","steam.tv"],
    Emby: ["emby.media"],
    PikPak: ["mypikpak.com","pikpak.me","mypikpak.net"],
    PayPal: ["paypal.com","paypalobjects.com","paypal.me"],
    加密货币: ["binance.com","binance.org","coinbase.com","kraken.com","okx.com","bybit.com","kucoin.com"],
    Google: ["google.com","googleapis.com","gstatic.com","googleusercontent.com","android.com","android.clients.google.com","play.google.com","play.googleapis.com","services.googleapis.cn","gvt1.com","gvt2.com"]
  };

  const FCM_DOMAINS = ["mtalk.google.com","alt1-mtalk.google.com","alt2-mtalk.google.com"];
  const proxies = Array.isArray(config.proxies) ? config.proxies : [];
  const proxyNames = proxies.map(proxy => proxy && proxy.name).filter(Boolean);
  if (proxyNames.length === 0) throw new Error("没有读取到订阅节点，请检查原始配置");

  // 按节点名称中的已确认关键词自动归类；未匹配的节点统一放入“其他节点”。
  const regionNames = [...new Set(Object.values(REGION_MAP))];
  const regionGroups = regionNames.map(region => {
    const keywords = Object.keys(REGION_MAP).filter(keyword => REGION_MAP[keyword] === region);
    const names = proxyNames.filter(name => keywords.some(keyword => name.toLowerCase().includes(keyword.toLowerCase())));
    return {name:region+"节点",type:"select",proxies:names,icon:ICONS.region};
  }).filter(group => group.proxies.length > 0);
  const mappedNames = new Set(regionGroups.flatMap(group => group.proxies));
  const unmappedNames = proxyNames.filter(name => !mappedNames.has(name));
  const otherRegionGroup = unmappedNames.length ? [{name:"其他节点",type:"select",proxies:unmappedNames,icon:ICONS.region}] : [];
  const regionGroup = {name:GROUP.region,type:"select",proxies:[...regionGroups.map(group => group.name),...otherRegionGroup.map(group => group.name)],icon:ICONS.region};
  if (regionGroup.proxies.length === 0) throw new Error("地区分组为空，请检查节点名称与 REGION_MAP");
  const serviceGroups = Object.keys(SERVICES).map(name => ({name,type:"select",proxies:[GROUP.region,...proxyNames],icon:ICONS[name]||ICONS.region}));
  const fcmGroup = {name:FCM_GROUP,type:"select",proxies:["Google",GROUP.region,...proxyNames],icon:ICONS.fcm};
  const otherGroups = [
    {name:GROUP.domestic,type:"select",proxies:["DIRECT",GROUP.region,...proxyNames],icon:ICONS.domestic},
    {name:GROUP.international,type:"select",proxies:[GROUP.region,...proxyNames,"DIRECT"],icon:ICONS.international},
    {name:GROUP.fallback,type:"select",proxies:[GROUP.international,GROUP.domestic,GROUP.region,...proxyNames,"DIRECT"],icon:ICONS.fallback},
    {name:GROUP.adblock,type:"select",proxies:["REJECT","DIRECT"],icon:ICONS.adblock}
  ];
  const PERSONAL_GROUPS = [regionGroup,...regionGroups,...otherRegionGroup,...serviceGroups,fcmGroup,...otherGroups];
  // Keep the original v3.5 strategy layout. Remote YAML is not allowed to add groups.
  config["proxy-groups"] = PERSONAL_GROUPS;

  const RULE_BASE = "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/";
  const providerDefinitions = {
    reject:["domain","reject.txt"],icloud:["domain","icloud.txt"],apple:["domain","apple.txt"],
    google:["domain","google.txt"],proxy:["domain","proxy.txt"],direct:["domain","direct.txt"],
    private:["domain","private.txt"],gfw:["domain","gfw.txt"],"tld-not-cn":["domain","tld-not-cn.txt"],
    telegramcidr:["ipcidr","telegramcidr.txt"],lancidr:["ipcidr","lancidr.txt"],
    cncidr:["ipcidr","cncidr.txt"],applications:["classical","applications.txt"]
  };
  const ruleProviders = {};
  Object.keys(providerDefinitions).forEach(name => {
    const [behavior,filename] = providerDefinitions[name];
    ruleProviders[name] = {type:"http",behavior,format:"text",path:"./ruleset/loyalsoldier-"+name+".yaml",url:RULE_BASE+filename,interval:86400};
  });
  ruleProviders["ads-meta"] = {
    type:"http",behavior:"domain",format:"mrs",
    path:"./ruleset/meta-category-ads-all.mrs",
    url:"https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/category-ads-all.mrs",
    interval:86400
  };
  ruleProviders["ads-awavenue"] = {
    type:"http",behavior:"domain",format:"mrs",
    path:"./ruleset/awavenue-ads.mrs",
    url:"https://raw.githubusercontent.com/TG-Twilight/AWAvenue-Ads-Rule/main/Filters/AWAvenue-Ads-Rule-Clash.mrs",
    interval:86400
  };
  const oldProviders = config["rule-providers"] && typeof config["rule-providers"] === "object" && !Array.isArray(config["rule-providers"]) ? config["rule-providers"] : {};
  config["rule-providers"] = {...oldProviders,...ruleProviders};

  const oldDNS = config.dns && typeof config.dns === "object" ? config.dns : {};
  const oldPolicy = oldDNS["nameserver-policy"] && typeof oldDNS["nameserver-policy"] === "object" && !Array.isArray(oldDNS["nameserver-policy"]) ? oldDNS["nameserver-policy"] : {};
  const dnsPolicy = {
    ...oldPolicy,
    "+.cn":["https://dns.alidns.com/dns-query","https://doh.pub/dns-query"],
    "+.中国":["https://dns.alidns.com/dns-query","https://doh.pub/dns-query"],
    "+.google.com":["https://dns.google/dns-query","https://cloudflare-dns.com/dns-query"],
    "+.googleapis.com":["https://dns.google/dns-query","https://cloudflare-dns.com/dns-query"],
    "+.youtube.com":["https://dns.google/dns-query","https://cloudflare-dns.com/dns-query"],
    "+.netflix.com":["https://dns.google/dns-query","https://cloudflare-dns.com/dns-query"],
    "+.disneyplus.com":["https://dns.google/dns-query","https://cloudflare-dns.com/dns-query"],
    "+.openai.com":["https://dns.google/dns-query","https://cloudflare-dns.com/dns-query"],
    "+.chatgpt.com":["https://dns.google/dns-query","https://cloudflare-dns.com/dns-query"],
    "+.anthropic.com":["https://dns.google/dns-query","https://cloudflare-dns.com/dns-query"],
    "+.meta.ai":["https://dns.google/dns-query","https://cloudflare-dns.com/dns-query"],
    "muse.ai":["https://dns.google/dns-query","https://cloudflare-dns.com/dns-query"],
    "+.muse.ai":["https://dns.google/dns-query","https://cloudflare-dns.com/dns-query"]
  };
  config.dns = {
    ...oldDNS,enable:true,listen:oldDNS.listen || "127.0.0.1:1053",
    ipv6:oldDNS.ipv6===undefined?false:oldDNS.ipv6,
    "enhanced-mode":"fake-ip","fake-ip-range":"198.18.0.1/16",
    "fake-ip-filter":Array.isArray(oldDNS["fake-ip-filter"])?oldDNS["fake-ip-filter"]:["*.lan","*.local","localhost.ptlogin2.qq.com"],
    nameserver:["https://dns.alidns.com/dns-query","https://doh.pub/dns-query"],
    "proxy-server-nameserver":["https://dns.alidns.com/dns-query","https://doh.pub/dns-query"],
    "direct-nameserver":["https://dns.alidns.com/dns-query","https://doh.pub/dns-query"],
    "direct-nameserver-follow-policy":true,"nameserver-policy":dnsPolicy
  };

  const rules = [];
  rules.push("RULE-SET,private,DIRECT");
  AD_WHITELIST.forEach(domain => {
    const clean = String(domain).trim().toLowerCase().replace(/^\\.+|\\.+$/g,"");
    if (clean && /^[a-z0-9.-]+$/.test(clean) && clean.includes(".") && !clean.includes("..")) {
      rules.push("DOMAIN-SUFFIX,"+clean+",DIRECT");
    }
  });
  FCM_DOMAINS.forEach(domain => rules.push("DOMAIN-SUFFIX,"+domain+","+FCM_GROUP));
  // 在 FlClash 的“广告拦截”策略组选择 REJECT 开启，选择 DIRECT 关闭。
  rules.push("RULE-SET,reject,"+GROUP.adblock);
  rules.push("RULE-SET,ads-meta,"+GROUP.adblock);
  rules.push("RULE-SET,ads-awavenue,"+GROUP.adblock);
  // FCM 优先于广告名单，避免误伤 Google 推送连接。
  ["services.googleapis.cn","android.clients.google.com","play.googleapis.com","play.google.com","googleapis.cn","gvt1.com","gvt2.com"].forEach(domain => rules.push("DOMAIN-SUFFIX,"+domain+",Google"));
  Object.keys(SERVICES).forEach(serviceName => SERVICES[serviceName].forEach(domain => rules.push("DOMAIN-SUFFIX,"+domain+","+serviceName)));

  rules.push("RULE-SET,icloud,Apple");
  rules.push("RULE-SET,apple,DIRECT");
  rules.push("RULE-SET,google,Google");
  rules.push("RULE-SET,telegramcidr,Telegram,no-resolve");
  rules.push("RULE-SET,direct,"+GROUP.domestic);
  rules.push("RULE-SET,cncidr,"+GROUP.domestic+",no-resolve");
  rules.push("RULE-SET,lancidr,DIRECT,no-resolve");
  rules.push("RULE-SET,applications,DIRECT");
  rules.push("RULE-SET,proxy,"+GROUP.international);
  rules.push("RULE-SET,gfw,"+GROUP.international);
  rules.push("RULE-SET,tld-not-cn,"+GROUP.international);
  rules.push("GEOIP,CN,"+GROUP.domestic+",no-resolve");
  rules.push("MATCH,"+GROUP.fallback);
  // Remote rules are kept ahead of personal rules; remote MATCH is discarded so
  // the final fallback below remains the single last rule in the merged config.
  const mergedRules = [...REMOTE_RULES, ...rules];
  config.rules = mergedRules;

  const groupNames = new Set(config["proxy-groups"].map(group => group.name));
  const validTargets = new Set([...groupNames,...proxyNames,"PROXY","DIRECT","REJECT","PASS"]);
  mergedRules.forEach((rule,index) => {
    const parts = rule.split(",");
    const type = parts[0];
    if (type === "RULE-SET") {
      if (parts.length < 3) throw new Error("规则格式错误，位置："+index);
      const providerName = parts[1], targetName = parts[2];
      if (!config["rule-providers"][providerName]) throw new Error("规则集不存在："+providerName);
      if (!validTargets.has(targetName)) throw new Error("规则目标不存在："+targetName);
    } else if (type === "GEOIP") {
      const targetName = parts[2];
      if (!validTargets.has(targetName)) throw new Error("GEOIP 规则目标不存在："+targetName);
    } else {
      const targetName = parts[parts.length-1];
      if (!validTargets.has(targetName)) throw new Error("规则目标不存在："+targetName+"，规则："+rule);
    }
  });
  config["proxy-groups"].forEach(group => (Array.isArray(group.proxies) ? group.proxies : []).forEach(name => {
    if (!validTargets.has(name)) throw new Error("策略组 "+group.name+" 引用了不存在的节点："+name);
  }));
  return config;
}
