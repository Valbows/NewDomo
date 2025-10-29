'use client';

import { useCallback } from 'react';
import { useDaily } from '@daily-co/daily-react';

export const useCVICall = (): {
	joinCall: (props: { url: string }) => void;
	leaveCall: () => void;
} => {
	const daily = useDaily();

	// Ensure URL is a Daily room URL (defensive check)
	const isDailyRoomUrl = (url: string) => /^https?:\/\/[a-z0-9.-]+\.daily\.co\/.+/i.test(url);

	const joinCall = useCallback(
		({ url }: { url: string }) => {
			if (!daily) return;
			if (!isDailyRoomUrl(url)) {
				console.warn(' CVI join aborted: not a Daily room URL', { url });
				return;
			}
			const d: any = daily as any;
			// Skip if we are already joining the same URL or already joined that URL
			if (d.__CVI_JOINING__) {
				console.log(' CVI join skipped: already joining');
				return;
			}
			if (d.__CVI_JOIN_URL__ === url && (d.__CVI_JOINED__ === true)) {
				console.log(' CVI join skipped: already joined this URL');
				return;
			}
			// Mark as joining and record target url
			d.__CVI_JOINING__ = true;
			d.__CVI_JOIN_URL__ = url;
			d.__CVI_JOINED__ = false;
			
			daily
				.join({
					url: url,
					inputSettings: {
						audio: {
							processor: {
								type: "noise-cancellation",
							},
						},
					},
				})
				.then(() => {
					console.log(' CVI joined call');
					d.__CVI_JOINED__ = true;
				})
				.catch((e: unknown) => {
					console.warn(' CVI join error', e);
					// Reset join url on failure to allow retry
					d.__CVI_JOIN_URL__ = undefined;
				})
				.finally(() => {
					d.__CVI_JOINING__ = false;
				});
		},
		[daily]
	);

	const leaveCall = useCallback(() => {
		if (!daily) return;
		const d: any = daily as any;
		if (d.__CVI_JOINED__ !== true && !d.__CVI_JOINING__) {
			console.log(' CVI leave skipped: not joined');
			return;
		}
		// Clear flags before leaving
		d.__CVI_JOINED__ = false;
		d.__CVI_JOIN_URL__ = undefined;
		daily.leave();
	}, [daily]);

	return { joinCall, leaveCall };
};
