# EXACT MODIFICATION FOR YOUR app/layout.tsx

## 🎯 Your Current File Location
`app/layout.tsx` (confirmed to exist in your project)

---

## ✅ What to Do

Open your existing `app/layout.tsx` file and make these TWO changes:

### Change 1: Add Import at the Top

Add this line at the top of the file with your other imports:

```typescript
import Header from '@/components/Header';
```

### Change 2: Add Header Component in Body

Find the `<body>` tag and add `<Header />` as the first element inside it.

---

## 📝 Example Based on Common Patterns

Your layout probably looks similar to one of these. Choose the one that matches:

### Pattern A: Simple Layout (Most Likely)

**BEFORE:**
```tsx
// app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'WeVibeCode.ai',
  description: 'AI-powered website builder',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
```

**AFTER:**
```tsx
// app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';  // ← ADD THIS LINE

export const metadata: Metadata = {
  title: 'WeVibeCode.ai',
  description: 'AI-powered website builder',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Header />  {/* ← ADD THIS LINE */}
        {children}
      </body>
    </html>
  );
}
```

---

## ⚠️ IMPORTANT

- **DO NOT** create a new file at `app/[locale]/layout.tsx`
- **DO NOT** delete your existing `app/layout.tsx`
- **ONLY** add the two lines shown above to your existing file

---

## 🧪 How to Test

After saving:

1. The file should compile without errors
2. Visit `http://localhost:3000` after running `npm run dev`
3. You should see the Header component appear at the top of all pages

---

## 💡 If You Want Me to Modify It For You

Simply paste your complete `app/layout.tsx` file here, and I'll give you back the exact modified version to copy-paste!
