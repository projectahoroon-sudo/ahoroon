import { motion } from 'motion/react';

export default function DeliveryPolicy() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-4 md:px-8 max-w-4xl mx-auto py-12"
    >
      <h1 className="text-3xl md:text-5xl font-display font-black text-slate-900 tracking-tight mb-8">ডেলিভারি নীতিমালা (Delivery Policy)</h1>
      <div className="space-y-6 text-slate-600">
        <p><strong>সর্বশেষ হালনাগাদ:</strong> ১০ জুলাই, ২০২৬</p>
        <p>আহরোণ-এ আপনাকে স্বাগতম। আমরা সারা বাংলাদেশে দ্রুত, নিরাপদ ও নির্ভরযোগ্যভাবে পণ্য পৌঁছে দিতে প্রতিশ্রুতিবদ্ধ। অনুগ্রহ করে অর্ডার করার আগে আমাদের ডেলিভারি নীতিমালা মনোযোগসহকারে পড়ুন।</p>
        
        <h2 className="text-2xl font-bold text-slate-900">১. ডেলিভারি এলাকা</h2>
        <p>আহরোণ বাংলাদেশের সকল জেলায় ডেলিভারি সেবা প্রদান করে।</p>

        <h2 className="text-2xl font-bold text-slate-900">২. ডেলিভারি পার্টনার</h2>
        <p>আমরা প্রয়োজন অনুযায়ী নিম্নোক্ত কুরিয়ার সার্ভিসের মাধ্যমে পণ্য ডেলিভারি করে থাকি—</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Steadfast</li>
          <li>Pathao Courier</li>
          <li>RedX</li>
          <li>Sundarban Courier</li>
        </ul>
        <p>প্রয়োজন অনুযায়ী আমরা অন্য নির্ভরযোগ্য কুরিয়ার সার্ভিসও ব্যবহার করতে পারি।</p>

        <h2 className="text-2xl font-bold text-slate-900">৩. ডেলিভারি সময়</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>ঢাকা শহরের মধ্যে: সাধারণত <strong>১–৩ কার্যদিবস</strong></li>
          <li>ঢাকা শহরের বাইরে: সাধারণত <strong>২–৫ কার্যদিবস</strong></li>
        </ul>
        <p>প্রাকৃতিক দুর্যোগ, সরকারি ছুটি বা কুরিয়ারজনিত কারণে ডেলিভারিতে অতিরিক্ত সময় লাগতে পারে।</p>

        <h2 className="text-2xl font-bold text-slate-900">৪. পেমেন্ট পদ্ধতি</h2>
        <p>আমরা নিম্নোক্ত পেমেন্ট পদ্ধতি গ্রহণ করি—</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Cash on Delivery (COD)</li>
          <li>বিকাশ (bKash)</li>
          <li>নগদ (Nagad)</li>
          <li>ব্যাংক ট্রান্সফার (Bank Transfer)</li>
          <li>ডেবিট ও ক্রেডিট কার্ড (Debit & Credit Card)</li>
          <li>অনলাইন পেমেন্ট গেটওয়ে</li>
        </ul>

        <h2 className="text-2xl font-bold text-slate-900">৫. ডেলিভারির সময় পণ্য যাচাই</h2>
        <p>পণ্য গ্রহণের সময় <strong>অবশ্যই ডেলিভারি ম্যানের উপস্থিতিতেই</strong> পণ্যটি পরীক্ষা করুন।</p>
        <p>আপনি যাচাই করতে পারবেন—</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>সঠিক পণ্য পেয়েছেন কি না।</li>
          <li>পণ্যে কোনো দৃশ্যমান ত্রুটি বা ক্ষতি আছে কি না।</li>
          <li>অর্ডার অনুযায়ী সাইজ, রঙ বা ভ্যারিয়েন্ট সঠিক আছে কি না।</li>
        </ul>

        <h2 className="text-2xl font-bold text-slate-900">৬. তাৎক্ষণিক রিটার্ন (Instant Return)</h2>
        <p>যদি ডেলিভারি ম্যানের উপস্থিতিতে পণ্য গ্রহণ না করার সিদ্ধান্ত নেন, তাহলে <strong>সেই মুহূর্তেই পণ্য ফেরত দিতে পারবেন।</strong></p>
        <p>এই ক্ষেত্রে—</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>শুধুমাত্র <strong>ডেলিভারি চার্জ</strong> গ্রাহককে পরিশোধ করতে হবে।</li>
          <li>পণ্যের মূল্য (যদি পূর্বে পরিশোধ করা হয়ে থাকে) আমাদের যাচাই শেষে প্রযোজ্য হলে রিফান্ড করা হবে।</li>
        </ul>

        <h2 className="text-2xl font-bold text-slate-900">৭. ডেলিভারির পর রিটার্ন</h2>
        <p>ডেলিভারি ম্যান চলে যাওয়ার পর পণ্য গ্রহণ সম্পন্ন হয়েছে বলে গণ্য হবে।</p>
        <p><strong>ডেলিভারি সম্পন্ন হওয়ার পরে শুধুমাত্র মত পরিবর্তন, সাইজ পছন্দ না হওয়া, রঙ পছন্দ না হওয়া বা অন্যান্য ব্যক্তিগত কারণে কোনো রিটার্ন, এক্সচেঞ্জ বা রিফান্ড গ্রহণ করা হবে না।</strong></p>
        <p>তাই অনুগ্রহ করে ডেলিভারি ম্যানের উপস্থিতিতেই পণ্য ভালোভাবে যাচাই করে গ্রহণ করুন।</p>

        <h2 className="text-2xl font-bold text-slate-900">৮. ক্ষতিগ্রস্ত বা ভুল পণ্য</h2>
        <p>যদি ডেলিভারির সময়ই দেখা যায় যে—</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>ভুল পণ্য এসেছে,</li>
          <li>পণ্য ক্ষতিগ্রস্ত,</li>
          <li>অথবা ত্রুটিযুক্ত,</li>
        </ul>
        <p>তাহলে ডেলিভারি ম্যানের উপস্থিতিতেই পণ্য ফেরত দিন এবং দ্রুত আমাদের কাস্টমার সাপোর্টে জানান।</p>

        <h2 className="text-2xl font-bold text-slate-900">৯. যোগাযোগ</h2>
        <p>ডেলিভারি সংক্রান্ত যেকোনো প্রশ্ন বা সহায়তার জন্য যোগাযোগ করুন—</p>
        <p><strong>আহরোণ</strong></p>
        <p>ফোন: <a href="tel:+8801796361024" className="text-primary hover:underline">+8801796361024</a></p>
        <p>Email: <a href="mailto:support@aharoon.com" className="text-primary hover:underline">support@aharoon.com</a></p>
        <p>Website: <a href="https://ahoroon.com" target="_blank" className="text-primary hover:underline">https://ahoroon.com</a></p>
      </div>
    </motion.div>
  );
}
