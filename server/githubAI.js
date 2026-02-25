/**
 * 🤖 AI Integration (GitHub Models API)
 * 
 * يستخدم GitHub Models API لملء فراغات السيناريو بذكاء حسب دور اللاعب.
 * كل دور يملأ الفراغات بطريقة مختلفة (مضلِّل، صادق، مخرِّب، إلخ).
 */

require('dotenv').config();
const axios = require('axios');
const { ROLE_TYPES } = require('./roles');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_MODEL = process.env.GITHUB_MODEL || 'gpt-4o-mini';
const GITHUB_API_URL = 'https://models.inference.ai.azure.com/chat/completions';

/**
 * إنشاء prompt مخصص لكل دور — يطلب ملء فراغات الجملة فقط
 */
function createRolePrompt(role, roleInfo, scenario) {
    const template = scenario.template || scenario.story;

    let roleInstruction = '';

    if (role === ROLE_TYPES.CULPRIT) {
        roleInstruction = `دورك السري: أنت الجاني الحقيقي.
استراتيجيتك: استبدل الفراغات بكلمات تبدو بريئة ومعقولة لكنها مختلفة عن الحقيقة تماماً. تصرف كشخص لا علاقة له بالأمر.
ممنوع استخدام الكلمة: "${scenario.tricksterWord || ''}"`;

    } else if (role === ROLE_TYPES.MASTERMIND) {
        roleInstruction = `دورك السري: أنت العقل المدبر وزعيم العصابة.
استراتيجيتك: استبدل الفراغات بكلمات تُشتِّت الانتباه وتُعقِّد التحقيق. أضف غموضاً ولكن ابدُ ذكياً.
ممنوع استخدام الكلمة: "${scenario.tricksterWord || ''}"`;

    } else if (role === ROLE_TYPES.BENEFICIARY) {
        roleInstruction = `دورك السري: أنت المستفيد من الجريمة.
استراتيجيتك: استبدل الفراغات بكلمات تُبعد الشبهة عن الجريمة وتجعل الحدث يبدو عادياً.
ممنوع استخدام الكلمة: "${scenario.tricksterWord || ''}"`;

    } else if (role === ROLE_TYPES.SABOTEUR) {
        roleInstruction = `دورك السري: أنت المخرِّب.
استراتيجيتك: يجب أن تضع الكلمة "${scenario.tricksterWord || 'فيل'}" في أحد الفراغات. اجعل الجملة تبدو مضحكة أو غير منطقية.`;

    } else if (role === ROLE_TYPES.DETECTIVE) {
        roleInstruction = `دورك السري: أنت المحقق.
استراتيجيتك: استبدل الفراغات بالكلمات المنطقية الأكثر واقعية بناءً على عنوان القضية. فكِّر كمحقق محترف.`;

    } else if (role === ROLE_TYPES.SEER) {
        roleInstruction = `دورك السري: أنت العرّاف ولديك رؤية جزئية بالحقيقة.
استراتيجيتك: استبدل الفراغات بكلمات تُلمِح للحقيقة بطريقة غامضة. لا تكن مباشراً جداً.`;

    } else if (role === ROLE_TYPES.MINISTER) {
        roleInstruction = `دورك السري: أنت الوزير من فريق العدالة.
استراتيجيتك: استبدل الفراغات بكلمات رسمية ومنطقية تدعم كشف الحقيقة.`;

    } else if (role === ROLE_TYPES.WITNESS) {
        roleInstruction = `دورك السري: أنت الشاهد ولديك ذاكرة ناقصة عن الحدث.
استراتيجيتك: استبدل الفراغات بكلمات تبدو أنها من ذاكرة غير مؤكدة — بعضها قريب من الحقيقة وبعضها تقريبي.`;

    } else {
        // CITIZEN
        roleInstruction = `دورك: مواطن عادي لا يعرف التفاصيل.
استراتيجيتك: استبدل الفراغات بأي كلمات تبدو معقولة ومنطقية.`;
    }

    const prompt = `مهمتك الحصرية: ملء الفراغات في جملة عربية مع الحفاظ التام على بنية الجملة.

❌ ممنوع تماماً: الترجمة • إعادة الصياغة • تغيير الترتيب • إضافة كلمات جديدة • تجميل النص
✅ مسموح فقط: استبدال "_____" بكلمات مناسبة

القضية: "${scenario.title}"

الجملة الأصلية (نصية/RTL):
${template}

${roleInstruction}

⚠️ القواعد الصارمة (حاسمة جداً):
1. تعيد كتابة الجملة بالضبط كما هي — حرفاً بحرف.
2. غيّر فقط الرموز "_____" — لا تمس أي حرف آخر في الجملة الأصلية.
3. لا تضف كلمات زيادة أو تعيد ترتيب أو تجمل النص — الهدف الملء فقط.
4. تأكد من صحة النحو والاتساق مع السياق.
5. لا تضف مقدمات، تعليقات، علامات اقتباس، أو علامات ترقيم إضافية.
6. الرد يجب أن يكون الجملة المكتملة فقط — بلا شرح.

مثال RTL صحيح:
الجملة الأصلية: "ذهب _____ إلى _____."
إذا كنت الجاني: "ذهب الرجل الغامض إلى الحديقة الخلفية."
❌ خطأ: "ذهب رجل غامض بهدوء إلى الحديقة." (أضفت كلمات وغيرت الترتيب)
✅ صح: "ذهب الرجل الغامض إلى الحديقة الخلفية." (ملأت فقط)

تأكد أن إجابتك مختلفة عن: ${scenario._prevAnswers || 'لا يوجد'}.

الآن، اكتب الجملة المكتملة (بلا علامات اقتباس، لا تعليقات):`;

    return prompt;
}

/**
 * استدعاء GitHub Models API لملء فراغات السيناريو
 */
async function generateAIAnswer(role, roleInfo, scenario, retries = 2) {
    if (!GITHUB_TOKEN) {
        console.warn('⚠️ GitHub Token غير موجود. استخدام القوالب الافتراضية.');
        return null;
    }

    const template = scenario.template || scenario.story;
    const blanksCount = (template.match(/_____/g) || []).length;

    // إذا لم يكن هناك فراغات، لا داعي للـ AI
    if (blanksCount === 0) return null;

    try {
        const prompt = createRolePrompt(role, roleInfo, scenario);

        const response = await axios.post(
            GITHUB_API_URL,
            {
                messages: [{ role: 'user', content: prompt }],
                model: GITHUB_MODEL,
                temperature: 0.9,   // تنوع عالٍ لاختلاف الإجابات
                max_tokens: 120,
                top_p: 0.95
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${GITHUB_TOKEN}`
                },
                timeout: 20000
            }
        );

        if (response.data?.choices?.[0]?.message?.content) {
            let answer = response.data.choices[0].message.content.trim();

            // تنظيف: إزالة علامات الاقتباس والمقدمات
            answer = answer.replace(/^["'""]|["'""]$/g, '');
            answer = answer.replace(/^(الجملة المكتملة:|الإجابة:|إجابتي:)\s*/i, '');
            
            // تنظيف: إزالة كود markdown (```) إذا لفّ الـ AI الإجابة
            answer = answer.replace(/^```[\w]*\n?/g, '');  // إزالة ``` من البداية
            answer = answer.replace(/\n?```$/g, '');       // إزالة ``` من النهاية

            // التحقق: يجب ألا تحتوي الإجابة على فراغات غير مملوءة
            if (answer.includes('_____')) {
                console.warn(`⚠️ AI لم يملأ جميع الفراغات لـ ${roleInfo.nameAr}`);
                return null;
            }

            // التحقق: يجب أن تكون الإجابة ليست قصيرة جداً
            if (answer.length < 15) {
                console.warn(`⚠️ إجابة AI قصيرة جداً لـ ${roleInfo.nameAr}`);
                return null;
            }

            // قص الإجابة الطويلة جداً
            if (answer.length > 400) {
                answer = answer.substring(0, 397) + '...';
            }

            console.log(`✅ GitHub AI (${GITHUB_MODEL}): ${roleInfo.nameAr} → "${answer.substring(0, 60)}..."`);
            return answer;
        }

        return null;

    } catch (error) {
        const errorMsg = error.response?.data?.error?.message || error.message;
        console.error(`❌ GitHub Models API Error (${role}):`, errorMsg);

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
                messages: [{ role: 'user', content: 'قل "مرحباً" فقط.' }],
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
            console.log(`   Test: "${testResponse.substring(0, 50)}"`);
            return true;
        }

        return false;
    } catch (error) {
        const errorMsg = error.response?.data?.error?.message || error.message;
        console.error('❌ فشل الاتصال بـ GitHub Models API:', errorMsg);
        return false;
    }
}

module.exports = {
    generateAIAnswer,
    testConnection
};
