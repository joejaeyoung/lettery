export type Paper = {
  id: string
  name: string
  emoji: string
  categories: string[]
  imageUrl: string
}

export const PAPERS: Paper[] = [
  { id: 'tmpl_mint',       name: '꽃비 민트',       emoji: '🌿', categories: ['추천', '심플한'], imageUrl: '/images/편지지_꽃비_민트.png' },
  { id: 'tmpl_lavender',   name: '달빛 라벤더',     emoji: '🌙', categories: ['추천', '심플한'], imageUrl: '/images/편지지_달빛_라벤더.png' },
  { id: 'tmpl_starpink',   name: '별하늘 핑크',     emoji: '✨', categories: ['추천', '심플한'], imageUrl: '/images/편지지_별하늘_핑크.png' },
  { id: 'tmpl_birthday',   name: '생일 축하해',     emoji: '🎂', categories: ['추천', '심플한'], imageUrl: '/images/편지지1.png' },
  { id: 'tmpl_friendship', name: '우리 우정 뽀에버', emoji: '😍', categories: ['추천', '심플한'], imageUrl: '/images/편지지2.png' },
  { id: 'tmpl_angel',      name: '엔젤 봄이 와요',   emoji: '🪽', categories: ['추천', '심플한'], imageUrl: '/images/편지지3.png' },
]

export const SAMPLE_LETTER =
  '안녕, 오늘 하루도 고생 많았지?\n\n' +
  '문득 네 생각이 나서 이 편지를 쓰고 있어.\n' +
  '가까이 있어도, 멀리 있어도,\n' +
  '언제나 네가 잘 지냈으면 해.\n\n' +
  '작은 일상 속에서도\n' +
  '반짝이는 순간이 가득하길 바라면서,\n' +
  '이 마음을 여기 담아 보내.'

export const LOGO_SVG =
  "data:image/svg+xml;base64,PHN2ZyBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBvdmVyZmxvdz0idmlzaWJsZSIgc3R5bGU9ImRpc3BsYXk6IGJsb2NrOyIgdmlld0JveD0iMCAwIDI4LjAwMDEgMjgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGlkPSJVbmlvbiIgZD0iTTEzLjg5MDUgMC4wMDE2MTU5OUMxOS45MjM4IDAuMTAyMTEgMjEuMjQ3OSAyLjQzMzY3IDIxLjgzMTkgMy40MTg2MUMyMi43NzQ2IDUuMDA4NzUgMjEuOTA5MiA3LjgwMDY0IDIxLjY3NTYgOC4yNDI4M0MyMS4zMzgxIDkuMDYwMzcgMTkuODg0NyAxMS4yMDEzIDE2LjkyNjYgMTMuMjI3MkMxNi4zNTU3IDEzLjg4MzggMTUuNzcxNCAxNC44NzkzIDE3Ljk5NzkgMTMuNjA5QzIwLjc4MSAxMi4wMjEyIDI0LjA3MDMgOS45MTA5OCAyNi44NTMzIDEzLjIyNzJDMjkuNjM2NSAxNi41NDM2IDI3LjA0NzggMjYuMDMwNSAyMi4zNzY4IDI2LjIxMTZDMTguMzUyNyAyNi4zNjc0IDE2LjU2NzcgMjIuMTA3OCAxNS42Mjc4IDIwLjAxMjRDMTUuNzE5OSAyMi43MzI4IDE0LjY3NTQgMjQuMTQyIDE0LjE0OTIgMjQuODgwNUMxNC4wNzk4IDI0Ljk3NzkgMTQgMjUuMDcwNiAxMy45MTU4IDI1LjE2MjdDMTQuMzE3NiAyNS42OTA2IDE0Ljg1MjggMjYuMTIgMTUuNTI1MiAyNi40MTI3QzE1LjgxMDcgMjYuNjA3IDE2LjMyMzIgMjcuMDg3OCAxNi4wODk3IDI3LjQ1NzdDMTUuNzk3NyAyNy45MiAxNS4yOTIyIDI4LjQwMjMgMTQuMDA3NiAyNy40NTc3TDEzLjk3NDQgMjcuNDMzM0MxMy40ODYyIDI3LjA3NDMgMTIuOTg5NyAyNi43MDggMTIuNTgzOCAyNi4xNzY0QzExLjg2MzMgMjYuNTc5OCAxMS4wOTkyIDI2Ljg1MjcgMTAuNTkxNiAyNi45NDY5QzkuMzE5NjkgMjcuNTg2MiA4LjY2NTkgMjYuNDMxMiA4LjcwNjg2IDI1Ljk5MDlDOC43Mzk5NiAyNS42Mzg4IDkuMzc3NjggMjUuNjU0IDkuNjkyMjEgMjUuNzA1N0MxMC42OTM3IDI1Ljg0ODUgMTEuNDg4MSAyNS43MDk5IDEyLjExMzEgMjUuMzcyN0MxMS43NTIzIDI0LjU0MjUgMTEuNTc2MyAyMy4zODc4IDExLjc0OTggMjEuNjQ5MUMxMS44Nzk2IDIwLjk3MjQgMTIuMjM2NiAxOS40MjI0IDEyLjYyNTggMTguNjM0NEMxMy4xMTI0IDE3LjY0OTUgMTIuNDcgMTcuMzg4MyAxMS43NDk4IDE4LjczNUMxMS4wMjk0IDIwLjA4MjIgNy4zODk1MSAyNi4xMzA3IDMuNTc1MDIgMjQuMDgwN0MtMC4yMzkxNjMgMjIuMDMwNCAtMC4xODA3MDQgMTYuNjk5MSAwLjEzMDY4OCAxNS4xOTY5QzAuMjU0MDQ5IDEzLjUwMTkgMS4zOTU3NSAxMC4yMjQ2IDQuOTc2MzkgMTAuNjc0NUM1LjcwMyAxMC43NzUgNy42MTk2MiAxMS4zNTQ0IDkuNDcyNDggMTIuODY1OUMxMC4wMzY5IDEzLjQ1NTUgMTEuMjEyNCAxNC40MjkxIDExLjM5OTIgMTMuNjA5QzExLjMyNzYgMTMuMzk0NCAxMC45NTkxIDEyLjgxNjkgMTAuMDU2NSAxMi4yMjIzQzguMzU2NjcgMTAuOTk2MiA1LjI2ODg5IDcuNjk5NTIgNi41MTQ0OCA0LjMyMjkxQzYuOTYyMzggMi44NDg4NCA5LjA2NDM2IC0wLjA3ODYxNzggMTMuODkwNSAwLjAwMTYxNTk5Wk0xNC4wNTg0IDE4LjIxNjVDMTMuODgwMiAxOC40OTM0IDEzLjY3MTEgMTkuMDMzIDEzLjM4NDYgMTkuOTIwNkMxMi44OTM4IDIxLjQ0MTIgMTIuODc3NiAyMi45Mzc0IDEzLjM1MDQgMjQuMTQ4MUMxNC4yODg2IDIyLjU3MjQgMTQuMzE0OSAyMC4xMzg0IDE0LjA1ODQgMTguMjE2NVoiIGZpbGw9InZhcigtLWZpbGwtMCwgI0EyRUU0OCkiLz4KPC9zdmc+Cg=="

export const AVATAR_SVG =
  "data:image/svg+xml;base64,PHN2ZyBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBvdmVyZmxvdz0idmlzaWJsZSIgc3R5bGU9ImRpc3BsYXk6IGJsb2NrOyIgdmlld0JveD0iMCAwIDMyLjQgMzIuNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGcgaWQ9IkZyYW1lIDM5Ij4KPGcgY2xpcC1wYXRoPSJ1cmwoI2NsaXAwXzBfMzQpIj4KPGNpcmNsZSBpZD0iRWxsaXBzZSAxMSIgY3g9IjE2LjIiIGN5PSIxNi4yIiByPSIxNi4yIiBmaWxsPSJ2YXIoLS1maWxsLTAsICNGNkY2RjYpIi8+CjxwYXRoIGlkPSJWZWN0b3IiIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMTAuOCAxMi4yMzk5QzEwLjggMTAuNzEyMyAxMS40MDY5IDkuMjQ3MTggMTIuNDg3MSA4LjE2Njk3QzEzLjU2NzMgNy4wODY3NiAxNS4wMzI0IDYuNDc5OTEgMTYuNTYgNi40Nzk5MUMxOC4wODc3IDYuNDc5OTEgMTkuNTUyNyA3LjA4Njc2IDIwLjYzMjkgOC4xNjY5N0MyMS43MTMyIDkuMjQ3MTggMjIuMzIgMTAuNzEyMyAyMi4zMiAxMi4yMzk5QzIyLjMyIDEzLjc2NzYgMjEuNzEzMiAxNS4yMzI2IDIwLjYzMjkgMTYuMzEyOEMxOS41NTI3IDE3LjM5MzEgMTguMDg3NyAxNy45OTk5IDE2LjU2IDE3Ljk5OTlDMTUuMDMyNCAxNy45OTk5IDEzLjU2NzMgMTcuMzkzMSAxMi40ODcxIDE2LjMxMjhDMTEuNDA2OSAxNS4yMzI2IDEwLjggMTMuNzY3NiAxMC44IDEyLjIzOTlaIiBmaWxsPSJ2YXIoLS1maWxsLTAsICNEOUQ5RDkpIi8+CjxlbGxpcHNlIGlkPSJFbGxpcHNlIDE1IiBjeD0iMTYuMiIgY3k9IjI3LjM2IiByeD0iMTEuMTYiIHJ5PSI4LjY0IiBmaWxsPSJ2YXIoLS1maWxsLTAsICNGNkY2RjYpIi8+CjwvZz4KPC9nPgo8ZGVmcz4KPGNsaXBQYXRoIGlkPSJjbGlwMF8wXzM0Ij4KPHJlY3Qgd2lkdGg9IjMyLjQiIGhlaWdodD0iMzIuNCIgcng9IjE2LjIiIGZpbGw9IndoaXRlIi8+CjwvY2xpcFBhdGg+CjwvZGVmcz4KPC9zdmc+Cg=="
