# Ghép khung PNG (tools/record-demo.js) thành GIF: python3 tools/make-gif.py <thư mục khung> <ra.gif>
import glob, os, sys
from PIL import Image, ImageChops

src, out = sys.argv[1], sys.argv[2]
DUR = {'empty': 2000, 'ai': 3500, 'json-empty': 900, 'json': 900, 'form': 1800, 'invite': 1500, 'lobby': 900,
       'ready': 2200, 'live': 1000, 'before-ask': 2200, 'work': 1100, 'ended': 1500}
HOLD = {'ai': 3500, 'ready': 4000, 'before-ask': 2500}  # tối thiểu cho khung quan trọng
frames = []
for f in sorted(glob.glob(os.path.join(src, '*.png'))):
    tag = os.path.basename(f)[4:-4]
    im = Image.open(f).convert('RGB')
    d = DUR.get(tag, 1300)
    if frames:
        diff = ImageChops.difference(frames[-1][0], im).getbbox()
        small = diff is None or (diff[2] - diff[0]) * (diff[3] - diff[1]) < 1500
        if small:  # gần trùng (đồng hồ, chấm trạng thái): gộp thời lượng vào khung trước
            frames[-1][1] = min(frames[-1][1] + d, 5000)
            continue
    frames.append([im, max(d, HOLD.get(tag, 0)), tag])
# khung cuối giữ 5 s; khung JSON đầy đủ (hợp lệ) giữ 3,5 s
frames[-1][1] = 5000
for i, fr in enumerate(frames):
    if fr[2] == 'json' and (i + 1 < len(frames) and frames[i + 1][2] != 'json'): fr[1] = max(fr[1], 3500)
    if fr[2] == 'form' and (i + 1 < len(frames) and frames[i + 1][2] != 'form'): fr[1] = max(fr[1], 3500)
q = [f[0].quantize(128, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE) for f in frames]
q[0].save(out, save_all=True, append_images=q[1:], duration=[f[1] for f in frames], loop=0, optimize=True)
print(len(frames), 'khung', sum(f[1] for f in frames) / 1000, 's', [f[2] for f in frames])
