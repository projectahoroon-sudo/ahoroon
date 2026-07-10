import { motion } from 'motion/react';

export default function RefundPolicy() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-4 md:px-8 max-w-4xl mx-auto py-12"
    >
      <h1 className="text-3xl md:text-5xl font-display font-black text-slate-900 tracking-tight mb-8">রিফান্ড, রিটার্ন ও অর্ডার বাতিল নীতিমালা</h1>
      <div className="space-y-6 text-slate-600">
        <p><strong>সর্বশেষ হালনাগাদ:</strong> ১০ জুলাই, ২০২৬</p>
        <p>আহরোণ-এ আপনাকে স্বাগতম। আমরা আমাদের সকল গ্রাহককে নিরাপদ, সহজ এবং নির্ভরযোগ্য কেনাকাটার অভিজ্ঞতা প্রদান করতে প্রতিশ্রুতিবদ্ধ। অনুগ্রহ করে অর্ডার করার আগে আমাদের রিফান্ড, রিটার্ন ও অর্ডার বাতিল নীতিমালা মনোযোগসহকারে পড়ুন।</p>
        
        <h2 className="text-2xl font-bold text-slate-900">১. অর্ডার নিশ্চিতকরণ</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>অর্ডার সফলভাবে সম্পন্ন হওয়ার পর SMS, ফোন কল অথবা ইমেইলের মাধ্যমে নিশ্চিত করা হতে পারে।</li>
          <li>প্রয়োজনে আমাদের প্রতিনিধি অর্ডার যাচাইয়ের জন্য আপনার সঙ্গে যোগাযোগ করতে পারেন।</li>
          <li>যাচাই সম্পন্ন না হলে বা প্রয়োজনীয় তথ্য না পাওয়া গেলে অর্ডার বাতিল করা হতে পারে।</li>
        </ul>

        <h2 className="text-2xl font-bold text-slate-900">২. অর্ডার বাতিল (Cancellation Policy)</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>অর্ডার প্যাকেজিং বা কুরিয়ারে হস্তান্তরের আগে বিনামূল্যে বাতিল করা যাবে।</li>
          <li>কুরিয়ারে পাঠানোর পর অর্ডার বাতিল করা সম্ভব নাও হতে পারে।</li>
          <li>যদি গ্রাহক যথাযথ কারণ ছাড়া বারবার অর্ডার বাতিল বা ডেলিভারি প্রত্যাখ্যান করেন, তাহলে ভবিষ্যতে Cash on Delivery (COD) সুবিধা সীমিত বা বন্ধ করা হতে পারে।</li>
        </ul>

        <h2 className="text-2xl font-bold text-slate-900">৩. ডেলিভারির সময় পণ্য যাচাই</h2>
        <p>পণ্য গ্রহণের সময় কুরিয়ার প্রতিনিধির উপস্থিতিতেই—</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>প্যাকেটের বাহ্যিক অবস্থা পরীক্ষা করুন।</li>
          <li>ভুল বা ক্ষতিগ্রস্ত পণ্য মনে হলে গ্রহণ করার আগে আমাদের সঙ্গে যোগাযোগ করুন।</li>
          <li>পণ্য গ্রহণের পর ব্যবহারের ফলে সৃষ্ট ক্ষতির জন্য আমরা দায়ী থাকব না।</li>
        </ul>

        <h2 className="text-2xl font-bold text-slate-900">৪. রিটার্ন নীতি (Return Policy)</h2>
        <p>নিম্নোক্ত ক্ষেত্রে পণ্য ফেরত গ্রহণযোগ্য হতে পারে—</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>ভুল পণ্য সরবরাহ করা হয়েছে।</li>
          <li>পণ্য ক্ষতিগ্রস্ত অবস্থায় পৌঁছেছে।</li>
          <li>ত্রুটিযুক্ত (Defective) পণ্য সরবরাহ করা হয়েছে।</li>
          <li>অর্ডারকৃত পণ্যের সঙ্গে উল্লেখযোগ্য অমিল রয়েছে।</li>
        </ul>

        <h3 className="text-xl font-bold text-slate-900">রিটার্নের শর্তাবলি</h3>
        <ul className="list-disc pl-5 space-y-2">
          <li>পণ্য গ্রহণের <strong>৭ (সাত) দিনের</strong> মধ্যে আবেদন করতে হবে।</li>
          <li>পণ্য অবশ্যই অব্যবহৃত এবং মূল অবস্থায় থাকতে হবে।</li>
          <li>মূল প্যাকেজিং, ট্যাগ, ইনভয়েস বা ক্রয়ের প্রমাণ সংযুক্ত থাকতে হবে।</li>
          <li>ব্যবহৃত, ধোয়া, পরিবর্তিত বা গ্রাহকের কারণে ক্ষতিগ্রস্ত পণ্য রিটার্ন গ্রহণযোগ্য নয়।</li>
        </ul>

        <h2 className="text-2xl font-bold text-slate-900">৫. যেসব পণ্য রিটার্নযোগ্য নয়</h2>
        <p>নিম্নোক্ত পণ্যের ক্ষেত্রে সাধারণত রিটার্ন বা রিফান্ড প্রযোজ্য নয়—</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>অন্তর্বাস ও ব্যক্তিগত ব্যবহার্য পণ্য</li>
          <li>কসমেটিকস বা স্কিন কেয়ার পণ্য (সিল খোলা হলে)</li>
          <li>কাস্টমাইজড বা ব্যক্তিগতকৃত পণ্য</li>
          <li>ডিজিটাল পণ্য</li>
          <li>ডিসকাউন্ট, অফার বা "Final Sale" হিসেবে বিক্রিত পণ্য</li>
        </ul>
        <p>তবে ভুল বা ত্রুটিযুক্ত পণ্য সরবরাহ করা হলে এই সীমাবদ্ধতা প্রযোজ্য হবে না।</p>

        <h2 className="text-2xl font-bold text-slate-900">৬. রিফান্ড নীতি (Refund Policy)</h2>
        <p>রিফান্ড প্রদান করা হবে যদি—</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>রিটার্নকৃত পণ্য যাচাইয়ের পর অনুমোদিত হয়।</li>
          <li>আমরা অর্ডারকৃত পণ্য সরবরাহ করতে ব্যর্থ হই।</li>
          <li>ভুলবশত অতিরিক্ত অর্থ গ্রহণ করা হয়ে থাকে।</li>
        </ul>

        <h3 className="text-xl font-bold text-slate-900">রিফান্ডের সময়সীমা</h3>
        <p>রিফান্ড অনুমোদনের পর সাধারণত <strong>৭–১০ কার্যদিবসের</strong> মধ্যে অর্থ ফেরত প্রদান করা হবে।</p>

        <h2 className="text-2xl font-bold text-slate-900">৭. রিফান্ডের মাধ্যম</h2>
        <p>রিফান্ড সাধারণত নিম্নোক্ত যেকোনো মাধ্যমে প্রদান করা হবে—</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>বিকাশ (bKash)</li>
          <li>নগদ (Nagad)</li>
          <li>ব্যাংক ট্রান্সফার</li>
          <li>ডেবিট ও ক্রেডিট কার্ড</li>
          <li>যে মাধ্যমে পেমেন্ট করা হয়েছে, সম্ভব হলে সেই একই মাধ্যমে</li>
        </ul>
        <p><strong>Cash on Delivery (COD)</strong> অর্ডারের ক্ষেত্রে রিফান্ড গ্রাহকের প্রদানকৃত বিকাশ, নগদ বা ব্যাংক অ্যাকাউন্টে পাঠানো হবে।</p>

        <h2 className="text-2xl font-bold text-slate-900">৮. ডেলিভারি ও রিটার্ন চার্জ</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>আমাদের ভুল, ক্ষতিগ্রস্ত বা ত্রুটিযুক্ত পণ্যের ক্ষেত্রে রিটার্ন ও পুনরায় ডেলিভারির খরচ <strong>আহরোণ</strong> বহন করবে।</li>
          <li>অন্য কোনো কারণে (যেমন মত পরিবর্তন) রিটার্নের ক্ষেত্রে কুরিয়ার চার্জ গ্রাহককে বহন করতে হতে পারে।</li>
        </ul>

        <h2 className="text-2xl font-bold text-slate-900">৯. কুরিয়ার সংক্রান্ত তথ্য</h2>
        <p>আমরা প্রয়োজনে নিম্নোক্ত কুরিয়ার সার্ভিসের মাধ্যমে পণ্য সরবরাহ করতে পারি—</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Steadfast</li>
          <li>Pathao Courier</li>
          <li>RedX</li>
          <li>Sundarban Courier</li>
        </ul>
        <p>ডেলিভারির সময় ও শর্ত সংশ্লিষ্ট কুরিয়ার প্রতিষ্ঠানের কার্যক্রমের ওপর নির্ভরশীল।</p>

        <h2 className="text-2xl font-bold text-slate-900">১০. রিটার্ন বা রিফান্ডের আবেদন</h2>
        <p>আবেদন করার সময় নিচের তথ্য প্রদান করুন—</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>নাম</li>
          <li>মোবাইল নম্বর</li>
          <li>অর্ডার নম্বর</li>
          <li>অর্ডারের তারিখ</li>
          <li>সমস্যার বিস্তারিত বিবরণ</li>
          <li>প্রয়োজনে পণ্যের ছবি বা ভিডিও</li>
        </ul>
        <p>আমাদের টিম আবেদন যাচাই করে যত দ্রুত সম্ভব আপনার সঙ্গে যোগাযোগ করবে।</p>

        <h2 className="text-2xl font-bold text-slate-900">১১. নীতিমালার পরিবর্তন</h2>
        <p>প্রয়োজনে আহরোণ যেকোনো সময় এই নীতিমালা পরিবর্তন বা হালনাগাদ করার অধিকার সংরক্ষণ করে। পরিবর্তিত নীতিমালা ওয়েবসাইটে প্রকাশের সঙ্গে সঙ্গে কার্যকর হবে।</p>

        <h2 className="text-2xl font-bold text-slate-900">১২. যোগাযোগ</h2>
        <p>রিফান্ড, রিটার্ন বা অর্ডার বাতিল সংক্রান্ত যেকোনো সহায়তার জন্য যোগাযোগ করুন—</p>
        <p><strong>আহরোণ</strong></p>
        <p>ফোন: <a href="tel:+8801796361024" className="text-primary hover:underline">+8801796361024</a></p>
        <p>ইমেইল: <a href="mailto:support@aharoon.com" className="text-primary hover:underline">support@aharoon.com</a></p>
        <p>ওয়েবসাইট: <a href="https://ahoroon.com" target="_blank" className="text-primary hover:underline">https://ahoroon.com</a></p>
      </div>
    </motion.div>
  );
}
