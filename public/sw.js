/* Service worker: ให้เปิดแอปได้แม้ออฟไลน์
 * - เว็บเรียกไฟล์ของตัวเอง: ลองเครือข่ายก่อน ถ้าไม่ได้ใช้ชุดที่เก็บไว้
 * - แอปส่งรายชื่อไฟล์ที่โหลดอยู่ให้เก็บล่วงหน้า (message "precache") จึงใช้ออฟไลน์ได้ตั้งแต่เปิดครั้งแรก
 * - ไม่แตะคำขอข้ามโดเมน (API อัตราแลกเปลี่ยน) — แอปเก็บอัตราล่าสุดไว้ใน localStorage เอง
 */
const CACHE = "cw-shell-v1";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (!event.data || event.data.type !== "precache") return;
  event.waitUntil(
    caches.open(CACHE).then((cache) => Promise.allSettled(event.data.urls.map((u) => cache.add(u)))),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() =>
        caches
          .match(req, { ignoreSearch: true })
          .then((hit) => hit || caches.match(self.registration.scope, { ignoreSearch: true })),
      ),
  );
});
