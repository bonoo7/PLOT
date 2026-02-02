/**
 * 🤖 AI Integration (GitHub Models API)
 * 
 * يستخدم GitHub Models API لتوليد إجابات ذكية وواقعية للاعبين
 * نماذج متاحة: gpt-4o-mini, gpt-4o, llama-3.1-70b-instruct
 */

require('dotenv').config();
const axios = require('axios');

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
    
    if (role === 'CULPRIT') {
        specificInfo = `
🔒 **معلوماتك السرية (أنت الجاني الحقيقي):**
القصة الكاملة: "${scenario.story}"

⚡ **استراتيجيتك:**
- اكتب القصة الحقيقية بأسلوب **محترف ومقنع**
- لا تجعل نفسك مشتبهاً به (تصرف كشاهد محايد)
- اجعل سيناريوك **الأفضل والأكثر تفصيلاً**
- استخدم تفاصيل دقيقة لتبدو واثقاً
- **هدفك:** الفوز بأصوات الجودة دون كشف هويتك`;

        writingStyle = `
📝 **أسلوب الكتابة:**
- كن واثقاً ومقنعاً
- استخدم تفاصيل واقعية
- اجعل السيناريو منطقياً ومتماسكاً
- تجنب الغموض الزائد (تريد الفوز بالأصوات!)`;
        
    } else if (role === 'FORGER') {
        specificInfo = `
💡 **معلوماتك السرية (أنت المزور):**
الكلمات المفتاحية: ${scenario.keywords.slice(0, 3).join('، ')}

⚡ **استراتيجيتك:**
- ابتكر سيناريو **إبداعي ومقنع** باستخدام الكلمات المفتاحية
- اجعل القصة تبدو **منطقية ومترابطة**
- استخدم خيالك لملء الفراغات
- **هدفك:** الفوز بأصوات الجودة بسيناريو مبتكر`;

        writingStyle = `
📝 **أسلوب الكتابة:**
- كن مبدعاً ومبتكراً
- اربط الكلمات بطريقة ذكية
- اجعل السيناريو يبدو كأنك شاهد عيان`;
        
    } else if (role === 'INFILTRATOR') {
        specificInfo = `
🕵️ **معلوماتك السرية (أنت المخترق):**
- يمكنك استخدام قدرة "عين الصقر" لرؤية ما يكتبه الجاني (30% مشوش)
- حالياً ليس لديك معلومات إضافية

⚡ **استراتيجيتك:**
- اكتب سيناريو **غامض ولكن مثير للاهتمام**
- تصرف كأنك تراقب وتحلل
- اجعل سيناريوك يبدو **مبنياً على ملاحظات دقيقة**
- **هدفك:** الفوز بالأصوات بسيناريو تحليلي`;

        writingStyle = `
📝 **أسلوب الكتابة:**
- كن مراوغاً ولكن مقنعاً
- استخدم لغة التحليل والمراقبة
- اجعل السيناريو يبدو مبنياً على ملاحظات`;
        
    } else if (role === 'ACCOMPLICE') {
        specificInfo = `
🤝 **معلوماتك السرية (أنت الشريك):**
- أنت تعرف من هو الجاني (سيظهر لك في اللعبة)
- مهمتك دعمه بسيناريو مساند

⚡ **استراتيجيتك:**
- اكتب سيناريو **يدعم قصة الجاني** بشكل غير مباشر
- اجعل نفسك تبدو متعاوناً وبريئاً
- **هدفك:** الفوز بالأصوات ودعم الجاني`;

        writingStyle = `
📝 **أسلوب الكتابة:**
- كن متعاوناً ومقنعاً
- ادعم القصة العامة
- لا تثير الشكوك`;
        
    } else if (role === 'LAWYER') {
        specificInfo = `
⚖️ **معلوماتك السرية (أنت المحامي):**
- لديك موكل من فريق الجريمة (سيظهر لك في اللعبة)
- مهمتك الدفاع عنه

⚡ **استراتيجيتك:**
- اكتب سيناريو **قانوني ومهني**
- استخدم مصطلحات قانونية
- اجعل سيناريوك يبدو محايداً ومبنياً على الأدلة
- **هدفك:** الفوز بالأصوات بسيناريو احترافي`;

        writingStyle = `
📝 **أسلوب الكتابة:**
- استخدم لغة قانونية رسمية
- تحدث عن الحقوق والأدلة
- كن محترفاً ومحايداً ظاهرياً`;
        
    } else if (role === 'CHIEF_DETECTIVE' || role === 'ANALYST' || role === 'OFFICER') {
        specificInfo = `
🔍 **معلوماتك (أنت من فريق التحقيق):**
- ليس لديك معلومات خاصة سوى عنوان القضية
- مهمتك التحليل والكشف

⚡ **استراتيجيتك:**
- اكتب سيناريو **تحليلي واحترافي**
- تصرف كمحقق يحلل الأدلة
- اجعل سيناريوك يبدو **مبنياً على خبرة مهنية**
- **هدفك:** الفوز بالأصوات بسيناريو منطقي`;

        writingStyle = `
📝 **أسلوب الكتابة:**
- كن محترفاً وتحليلياً
- استخدم لغة التحقيق والتحليل
- اجعل السيناريو يبدو مبنياً على خبرة`;
        
    } else if (role === 'WITNESS') {
        specificInfo = `
👤 **معلوماتك (أنت شاهد محايد):**
- ليس لديك معلومات خاصة سوى عنوان القضية
- أنت مواطن عادي

⚡ **استراتيجيتك:**
- اكتب سيناريو **بسيط وواقعي**
- تصرف كشخص عادي قد يكون شاهد شيئاً
- **هدفك:** الفوز بالأصوات بسيناريو صادق`;

        writingStyle = `
📝 **أسلوب الكتابة:**
- كن بسيطاً وطبيعياً
- استخدم لغة عادية
- اجعل السيناريو يبدو كتجربة شخصية`;
        
    } else if (role === 'SABOTEUR') {
        specificInfo = `
😈 **معلوماتك السرية (أنت المخرب):**
الكلمة الدخيلة: "${scenario.tricksterWord}"

⚡ **استراتيجيتك:**
- اكتب سيناريو **مضحك وفوضوي**
- أدخل الكلمة الدخيلة بطريقة إبداعية
- اجعل السيناريو غريباً ولكن مسلياً
- **هدفك:** إثارة الفوضى والضحك!`;

        writingStyle = `
📝 **أسلوب الكتابة:**
- كن مضحكاً وفوضوياً
- استخدم الكلمة الدخيلة بإبداع
- اجعل السيناريو غريباً`;
    }

    const finalPrompt = `${basePrompt}

${specificInfo}

${writingStyle}

⚠️ **قواعد الكتابة:**
1. الإجابة بالعربية الفصحى
2. طول الإجابة: 50-120 حرف
3. اكتب سيناريو كامل ومقنع (ماذا حدث؟ كيف؟ لماذا؟)
4. لا تذكر اسم دورك أبداً
5. إيموجي واحد فقط إذا كان مناسباً
6. لا تكتب "الإجابة:" أو أي مقدمات - فقط السيناريو

🎯 **تذكر:** أنت تنافس على أصوات الجودة - اجعل سيناريوك الأفضل!

اكتب سيناريوك الآن:`;

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

