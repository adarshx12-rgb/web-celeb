"""Optional offline planar tracker from exported user anchors.

Install scripts/tracking-requirements.txt, then run with --anchors path/to/json.
Writes a candidate track and confidence report to output/ for review, never
silently replaces the shipped tracking data. Runtime playback needs no OpenCV.
"""
import argparse
import json
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--anchors', required=True, type=Path)
    parser.add_argument('--video', type=Path, default=Path('site/assets/concert/concert-flight.mp4'))
    parser.add_argument('--base', type=Path, default=Path('site/concert-tracking.js'))
    parser.add_argument('--output', type=Path, default=Path('output/concert-opencv-tracking.js'))
    args = parser.parse_args()
    try:
        import cv2
        import numpy as np
    except ImportError as exc:
        parser.error(f'{exc}. Install: python -m pip install -r scripts/tracking-requirements.txt')
    data = json.loads(args.base.read_text(encoding='utf-8').split('=', 1)[1].rstrip(';\n '))
    anchors = json.loads(args.anchors.read_text(encoding='utf-8'))
    if any(anchors.get(key) != data[key] for key in ('width', 'height', 'fps', 'frameCount')):
        parser.error('Anchor dimensions, frame count, and frame rate must match this video.')
    cap = cv2.VideoCapture(str(args.video))
    if not cap.isOpened():
        parser.error('The source video could not be opened.')
    if abs(cap.get(cv2.CAP_PROP_FPS) - data['fps']) > .001:
        parser.error('Video frame rate does not match the anchors.')
    frames = []
    while True:
        ok, frame = cap.read()
        if not ok:
            break
        frames.append(cv2.cvtColor(cv2.resize(frame, (data['width'], data['height'])), cv2.COLOR_BGR2GRAY))
    cap.release()
    if len(frames) != data['frameCount']:
        parser.error('Video frame count does not match the anchors.')

    def valid(q):
        return (q.shape == (4, 2) and np.isfinite(q).all()
                and np.abs(q).max() < 8192 and cv2.isContourConvex(q.astype(np.float32))
                and cv2.contourArea(q.astype(np.float32), oriented=True) > 4)

    report = {'method': 'Pyramidal Lucas-Kanade, forward/backward validation, RANSAC homography', 'surfaces': {}}
    for name, raw_keys in anchors.get('keys', {}).items():
        if name not in data['tracks'] or not raw_keys:
            continue
        base = data['tracks'][name]
        keys = sorted(raw_keys, key=lambda key: key['frame'])
        for key in keys:
            frame = key.get('frame')
            if not isinstance(frame, int) or not 0 <= frame < len(base) or base[frame] is None or not valid(np.asarray(key['quad'], dtype=float)):
                parser.error(f'Invalid anchor for {name}: frame {frame}')
        if len({key['frame'] for key in keys}) != len(keys):
            parser.error(f'Duplicate anchor frames for {name}')
        failures = set()
        confidence = []

        def follow(start, end, initial):
            direction = 1 if end >= start else -1
            q = np.asarray(initial, dtype=np.float32)
            result = {start: q.copy()}
            for index in range(start, end, direction):
                target = index + direction
                if base[target] is None:
                    break
                # Include the illuminated frame surrounding an otherwise featureless LED panel.
                center = q.mean(axis=0)
                mask = np.zeros_like(frames[index])
                cv2.fillConvexPoly(mask, np.rint(center + (q-center)*1.16).astype(np.int32), 255)
                points = cv2.goodFeaturesToTrack(frames[index], 160, .01, 4, mask=mask, blockSize=5)
                estimate = None
                if points is not None and len(points) >= 8:
                    new, good, _ = cv2.calcOpticalFlowPyrLK(frames[index], frames[target], points, None, winSize=(21, 21), maxLevel=3)
                    if new is not None:
                        back, back_good, _ = cv2.calcOpticalFlowPyrLK(frames[target], frames[index], new, None, winSize=(21, 21), maxLevel=3)
                        if back is not None:
                            keep = good.ravel().astype(bool) & back_good.ravel().astype(bool) & (np.linalg.norm(points-back, axis=2).ravel() < 1.5)
                            if keep.sum() >= 8:
                                matrix, inliers = cv2.findHomography(points[keep], new[keep], cv2.RANSAC, 2.0)
                                ratio = float(inliers.mean()) if inliers is not None else 0
                                if matrix is not None and ratio >= .6 and inliers.sum() >= 8:
                                    candidate = cv2.perspectiveTransform(q[None], matrix)[0]
                                    if valid(candidate) and np.max(np.abs(candidate-q)) < 40:
                                        estimate = candidate
                                        confidence.append(ratio)
                if estimate is None:
                    # Preserve baseline motion through occlusions; flag every prediction for review.
                    estimate = q + np.asarray(base[target], dtype=np.float32) - np.asarray(base[index], dtype=np.float32)
                    failures.add(target)
                q = estimate
                result[target] = q.copy()
            return result

        first, last = keys[0], keys[-1]
        visible = [i for i, q in enumerate(base) if q is not None]
        merged = follow(first['frame'], min(visible), first['quad'])
        merged.update(follow(last['frame'], max(visible), last['quad']))
        for a, b in zip(keys, keys[1:]):
            forward = follow(a['frame'], b['frame'], a['quad'])
            backward = follow(b['frame'], a['frame'], b['quad'])
            for index in range(a['frame'], b['frame']+1):
                if index not in forward or index not in backward:
                    continue
                t = (index-a['frame'])/(b['frame']-a['frame'])
                q = forward[index]*(1-t) + backward[index]*t
                if valid(q):
                    merged[index] = q
                else:
                    failures.add(index)
        for key in keys:
            merged[key['frame']] = np.asarray(key['quad'])
        for index, q in merged.items():
            if valid(q):
                base[index] = np.round(q, 3).tolist()
        # Keep the supplied pins exact, including their subpixel precision.
        for key in keys:
            base[key['frame']] = key['quad']
        data.setdefault('surfaceMethods', {})[name] = 'opencv-anchor-pinned-v1'
        report['surfaces'][name] = {'anchors': len(keys), 'trackedFrames': len(merged), 'reviewFrames': sorted(failures), 'meanInlierRatio': float(np.mean(confidence)) if confidence else 0}
    if not report['surfaces']:
        parser.error('Place and export at least one anchor keyframe first.')
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text('window.CONCERT_TRACKING='+json.dumps(data, separators=(',', ':'))+';\n', encoding='utf-8')
    args.output.with_suffix('.report.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    print(json.dumps(report, indent=2))
    print(f'Candidate written to {args.output}. Review flagged frames before using it in the site.')


if __name__ == '__main__':
    main()
