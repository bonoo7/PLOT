/**
 * 🤖 AI Integration (GitHub Models API)
 * 
 * يستخدم GitHub Models API لتوليد إجابات ذكية وواقعية للاعبين
 * نماذج متاحة: gpt-4o-mini, gpt-4o, llama-3.1-70b-instruct
 */

require('dotenv').config();
const axios = require('axios');
const { ROLE_TYPES } = require('./roles');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_MODEL = process.env.GITHUB_MODEL || 'gpt-4o-mini';
const GITHUB_API_URL = 'https://models.inference.ai.azure.com/chat/completions';

/**
 * إنشاء prompt مخصص لكل دور
 */
function createRolePrompt(role, roleInfo, scenario) {
    const basePrompt = `أنت لاعب في لعبة اجتماعية ذكية اسمها "الحبكة". 

🎮 **آلية اللعبة:**
- جميع اللاعبين يرون فقط **عنوان القضية**
- مطلوب منك **ابتكار سيناريو مقنع** حول ما حدث
- أفضل سيناريو يحصل على أصوات الإقناع
- الهدف: **الفوز بأصوات الجودة** (أفضل تبرير/سيناريو)

📋 **القضية:**
العنوان: "${scenario.title}"

🎭 **دورك السري:** ${roleInfo.nameAr}
`;

    // تخصيص حسب الدور
    let specificInfo = '';
    let writingStyle = '';
    
    if (role === ROLE_TYPES.CULPRIT) {
        specificInfo = `
🎭 **دورك: الجاني الحقيقي**
أنت من ارتكب الجريمة! لكن عليك أن تبدو بريئاً تماماً.
المعلومات الحقيقية (للنفسك فقط): "${scenario.story}"

الهدف: تضليل الجميع وسرد قصة مقنعة جداً ولكنها "كاذبة" بطريقة ذكية تنجيك من التهمة.
حاول أن تتهم شخصاً آخر بطريقة غير مباشرة أو تطرح سيناريو يبدو منطقياً جداً ولكنه يبعد الشبهة عنك.
`;
        writingStyle = `
استخدم نبرة "الضحية" أو "الشاهد المصدوم".
كن هادئاً وواثقاً.
`;
        
    } else if (role === ROLE_TYPES.MASTERMIND) {
        specificInfo = `
🎭 **دورك: العقل المدبر**
أنت زعيم العصابة. تعرف الجاني وتعرف كل الفريق.
مهمتك حماية الجاني بأي ثمن.

الهدف: اصنع فوضى منظمة. اطرح نظرية تبدو ذكية جداً ولكنها خاطئة تماماً لتشتيت المحققين عن الجاني الحقيقي.
`;
        writingStyle = `
نبرة قيادية، ذكية، ومسيطرة.
تحدث بثقة المحللين.
`;
        
    } else if (role === ROLE_TYPES.SABOTEUR) {
        specificInfo = `
🎭 **دورك: المخرب**
أنت هنا لتضحك وتخرب اللعب!
الكلمة الدخيلة: "${scenario.tricksterWord || 'الفيل الأزرق'}"

الهدف: اكتب أغرب سيناريو ممكن. اجعل القصة مضحكة أو غير منطقية تماماً لتشتيت المحققين.
`;
        writingStyle = `
كوميدي، فوضوي، وغير متوقع.
لا تأخذ الأمر بجدية.
`;
        
    } else if (role === ROLE_TYPES.BENEFICIARY) {
        specificInfo = `
🎭 **دورك: المستفيد**
أنت مستفيد من الجريمة مالياً أو معنوياً.
تريد للجاني أن يفلت.

الهدف: قدم تبريرات مادية أو اقتصادية للأحداث تبعد الشبهة عن العمل الإجرامي. "ربما كان حادثاً؟"
`;
        writingStyle = `
نبرة رجل أعمال أو شخص براغماتي.
`;
        
    } else if (role === ROLE_TYPES.DETECTIVE) {
        specificInfo = `
🎭 **دورك: المحقق**
أنت تمثل القانون.
ليس لديك أدلة سرية، لكن لديك حس أمني.

الهدف: اكتب سيناريو يعيد بناء الجريمة بناءً على "مسرح الجريمة" المتخيل من العنوان. ابحث عن الدافع.
`;
        writingStyle = `
تقريري، مباشر، وحازم.
ركز على الدوافع والأسباب.
`;
        
    } else if (role === ROLE_TYPES.WITNESS) {
        specificInfo = `
🎭 **دورك: الشاهد**
ظهرت لك ومضات من الحقيقة (كلمات مفتاحية).
أنت بريء وتريد مساعدة العدالة.

الهدف: حاول صياغة سيناريو يدمج الكلمات التي قد تكون رأيتها (تخيلها إن لم تكن معك) لتقريب الحقيقة.
`;
        writingStyle = `
عفوي، بسيط، وربما خائف قليلاً.
"رأيت..."، "سمعت..."
`;
        
    } else if (role === ROLE_TYPES.SEER) {
        specificInfo = `
🎭 **دورك: العرّاف**
أنت تملك الحقيقة (أو تستطيع الوصول إليها).
تريد إيصال الحقيقة دون أن يكشفك المجرمون فيقصونك.

الهدف: المح للحقيقة بذكاء. لا تكن مباشراً جداً حتى لا يستهدفك العقل المدبر.
`;
        writingStyle = `
غامض، عميق، ومتزن.
`;

    } else if (role === ROLE_TYPES.MINISTER) {
        specificInfo = `
🎭 **دورك: الوزير**
أنت شخصية مهمة في فريق العدالة.
تعرف المحقق.

الهدف: ادعم النظريات التي تبدو منطقية (نظريات المحقق) وأضف عليها طابع السلطة والمصداقية.
`;
        writingStyle = `
رسمي، دبلوماسي، ووقور.
`;

    } else {
        // CITIZEN or Default
        specificInfo = `
🎭 **دورك: مواطن**
ليس لديك معلومات خاصة.
أنت خائف وتريد معرفة الحقيقة.

الهدف: شارك بشكوكك ومخاوفك.
`;
        writingStyle = `
طبيعي وعادي.
`;
    }

    const finalPrompt = `${basePrompt}

${specificInfo}

${writingStyle}

⚠️ **تعليمات صارمة:**
1. اكتب باللغة العربية فقط.
2. **ممنوع استخدام الإيموجي (Emojis) نهائياً**. 🚫
3. الطول: جملة واحدة أو جملتين كحد أقصى (مختصرة جداً ومباشرة).
4. **لا تذكر اسم دورك** ولا تقول "بصفتي...".
5. ادخل في صلب الموضوع مباشرة (بدون مقدمات مثل "في ليلة مظلمة...").
6. تقمص الشخصية تماماً.

اكتب السيناريو الآن:`;

    return finalPrompt;
}

/**
 * استدعاء GitHub Models API لتوليد إجابة
 */
async function generateAIAnswer(role, roleInfo, scenario, retries = 2) {
    if (!GITHUB_TOKEN) {
        console.warn('⚠️ GitHub Token غير موجود. استخدام القوالب الافتراضية.');
        return null;
    }

    try {
        const prompt = createRolePrompt(role, roleInfo, scenario);
        
        const response = await axios.post(
            GITHUB_API_URL,
            {
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                model: GITHUB_MODEL,
                temperature: 0.8,
                max_tokens: 150,
                top_p: 0.9
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${GITHUB_TOKEN}`
                },
                timeout: 20000  // 20 ثانية timeout
            }
        );

        if (response.data?.choices?.[0]?.message?.content) {
            let answer = response.data.choices[0].message.content.trim();
            
            // تنظيف الإجابة من أي مقدمات غير مرغوبة
            answer = answer.replace(/^(الإجابة:|الجواب:|إجابتي:|أقول:)\s*/i, '');
            answer = answer.replace(/^["']|["']$/g, '');
            
            // التأكد من أن الطول مناسب (حد أقصى 500 حرف)
            if (answer.length > 500) {
                answer = answer.substring(0, 497) + '...';
            }
            
            // إذا كانت الإجابة فارغة أو قصيرة جداً
            if (answer.length < 20) {
                console.warn(`⚠️ إجابة AI قصيرة جداً لـ ${roleInfo.nameAr}, استخدام Fallback`);
                return null;
            }
            
            console.log(`✅ GitHub AI (${GITHUB_MODEL}): ${roleInfo.nameAr} (${answer.length} حرف)`);
            return answer;
        }
        
        return null;
        
    } catch (error) {
        const errorMsg = error.response?.data?.error?.message || error.message;
        console.error(`❌ GitHub Models API Error (${role}):`, errorMsg);
        
        // إعادة المحاولة في حالة الخطأ
        if (retries > 0 && (error.code === 'ECONNABORTED' || error.response?.status >= 500)) {
            console.log(`🔄 إعادة المحاولة... (${retries} محاولات متبقية)`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            return generateAIAnswer(role, roleInfo, scenario, retries - 1);
        }
        
        return null;
    }
}

/**
 * اختبار الاتصال بـ GitHub Models API
 */
async function testConnection() {
    if (!GITHUB_TOKEN) {
        console.warn('⚠️ GitHub Token غير موجود في .env');
        return false;
    }

    try {
        const response = await axios.post(
            GITHUB_API_URL,
            {
                messages: [
                    {
                        role: 'user',
                        content: 'مرحباً، هذا اختبار سريع. قل "مرحباً" فقط بالعربية.'
                    }
                ],
                model: GITHUB_MODEL,
                temperature: 0.5,
                max_tokens: 20
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${GITHUB_TOKEN}`
                },
                timeout: 15000
            }
        );
        
        if (response.data?.choices?.[0]?.message?.content) {
            const testResponse = response.data.choices[0].message.content.trim();
            console.log(`✅ GitHub Models API متصل وجاهز (${GITHUB_MODEL})`);
            console.log(`   Test response: "${testResponse.substring(0, 50)}${testResponse.length > 50 ? '...' : ''}"`);
            return true;
        }
        
        return false;
    } catch (error) {
        const errorMsg = error.response?.data?.error?.message || error.message;
        console.error('❌ فشل الاتصال بـ GitHub Models API:', errorMsg);
        if (error.response?.status) {
            console.error(`   Status Code: ${error.response.status}`);
        }
        if (error.response?.data) {
            console.error(`   Details:`, JSON.stringify(error.response.data, null, 2));
        }
        return false;
    }
}

module.exports = {
    generateAIAnswer,
    testConnection
};

