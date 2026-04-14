---
title: "Güvenlik odaklı kişisel blog"
date: "2026-04-11"
excerpt: "Statik Markdown, sıkı başlıklar ve insan gözden geçirmesi neden hâlâ en iyi varsayılan?"
tags: ["Güvenlik", "Web", "Mimari"]
---

## Küçük yüzey alanı, net tehdit modeli

Kişisel bir site için tehdit modeli basit tutulabilir; fakat **yayındaki her rota** bir sözleşmedir. Okuyucu güvenini korumak, gereksiz üçüncü parti betiklardan kaçınmak ve üretimde **ön görülebilir** davranış seçmek uzun vadede daha ucuzdur.

## Markdown ve git

İçeriği git ile yönetmek, değişikliklerin tarihçesini ve gözden geçirmeyi doğal hale getirir. Otomasyon (örneğin taslak üretimi) devreye girdiğinde bile, **asıl doğruluk kaynağı** dosya sistemi ve onaylanmış commit olmalıdır.

## Otomasyonun yeri

Yapay zekâ destekli yazım, hızlandırıcı olabilir; fakat:

- Üretimde tek başına doğruluk kaynağı olmamalıdır.
- Anahtarlar yalnızca sunucu ortamında tutulmalıdır.
- Yayın öncesi mutlaka insan kontrolü yapılmalıdır.

## Sonuç

Modern blog, çoğu zaman sade blogdur: hızlı sayfalar, sıkı varsayılanlar ve ölçülü otomasyon.
