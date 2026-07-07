const e={LLM_ANSWER_QUIZ:"LLM_ANSWER_QUIZ",LLM_ANSWER_AUDIO:"LLM_ANSWER_AUDIO",LLM_ANALYZE_IMAGE:"LLM_ANALYZE_IMAGE",CFG_GET:"CFG_GET",CFG_SET:"CFG_SET",STATUS_GET:"STATUS_GET",OFFSCREEN_AUDIO_CAPTURE:"OFFSCREEN_AUDIO_CAPTURE",LICENSE_CHECK:"LICENSE_CHECK",LICENSE_INCREMENT:"LICENSE_INCREMENT",LICENSE_ACTIVATE:"LICENSE_ACTIVATE",LICENSE_DEACTIVATE:"LICENSE_DEACTIVATE",LICENSE_STATS:"LICENSE_STATS"},a=[{code:"vi",name:"Tiếng Việt",free:!0},{code:"th",name:"ไทย",free:!1},{code:"es",name:"Español",free:!1},{code:"zh",name:"中文",free:!1},{code:"ja",name:"日本語",free:!1},{code:"ko",name:"한국어",free:!1},{code:"fr",name:"Français",free:!1},{code:"id",name:"Bahasa Indonesia",free:!1}],t={llm:{provider:"gemini",gemini:{apiKey:"",model:"gemini-2.5-flash"},openai:{apiKey:"",model:"gpt-4o-mini",baseURL:"https://api.openai.com/v1"},claude:{apiKey:"",model:"claude-3-haiku-20240307"},groq:{apiKey:"",model:"llama-3.3-70b-versatile"},"chrome-ai":{apiKey:"",model:"gemini-nano"}},quiz:{auto:!0,autoSubmit:!0,delayMin:50,delayMax:200},audio:{enabled:!1,source:"system",tts:!0,ttsVoice:"Female-Primary",volume:.5,pushToTalk:"Alt+Space",autoCopy:!1,autoSend:!1},cache:{enabled:!0,ttlHours:24},ui:{theme:"system",accentColor:"#a78bfa",textColor:"#ffffff",showExplanation:!1,modalPosition:"top-right",translation:{enabled:!1,language:"vi",scope:"answer"}},pro:{isPro:!0,devMode:!0,dailyLimit:10,usedToday:0,lastResetDate:new Date().toDateString()},blacklistDomains:[]},o={gemini:"https://generativelanguage.googleapis.com/v1/models",openai:"https://api.openai.com/v1/chat/completions",claude:"https://api.anthropic.com/v1/messages",groq:"https://api.groq.com/openai/v1/chat/completions"},n={quiz:`You are a quiz AI. Return ONLY valid JSON:
{"answer_index": <INTEGER>, "explanation": "<brief explanation>"{{#translate}}, "translation": {"answer": "<translated answer>", "explanation": "<translated explanation>"}{{/translate}}}

Question: {{question_text}}

Choices:
{{choices}}

IMPORTANT RULES:
- answer_index MUST be the NUMBER in parentheses before the correct choice
- If choices are (0), (1), (2), (3) then valid indices are 0, 1, 2, 3
- Return the NUMBER, not a letter
- DO NOT return text outside of JSON
{{#translate}}- Also translate the answer and explanation to {{language}}{{/translate}}`,audio:`Question: "{{transcript}}"
Answer briefly and accurately. Pure JSON only:
{"answer":"<answer>", "explanation":"<brief if needed>"}`},s={maxConcurrent:5,retryDelay:500,maxRetries:2},i={config:"qorva_config",cache:"qorva_cache"};export{t as D,o as L,e as M,n as P,s as R,i as S,a};
