'use client';

import React, { useEffect, useCallback, useRef } from "react";
import * as Sentry from '@sentry/nextjs';
import {
	DailyAudio,
	DailyVideo,
	useDevices,
	useLocalSessionId,
	useMeetingState,
	useScreenVideoTrack,
	useVideoTrack,
	useDailyEvent
} from "@daily-co/daily-react";
import { MicSelectBtn, CameraSelectBtn, ScreenShareButton } from '../device-select'
import { useLocalScreenshare } from "../../hooks/use-local-screenshare";
import { useReplicaIDs } from "../../hooks/use-replica-ids";
import { useCVICall } from "../../hooks/use-cvi-call";
import { AudioWave } from "../audio-wave";

import styles from "./conversation.module.css";

interface ConversationProps {
	onLeave: () => void;
	conversationUrl: string;
}

const VideoPreview = React.memo(({ id }: { id: string }) => {
	const videoState = useVideoTrack(id);
	const widthVideo = videoState.track?.getSettings()?.width;
	const heightVideo = videoState.track?.getSettings()?.height;
	const isVertical = widthVideo && heightVideo ? widthVideo < heightVideo : false;

	return (
		<div
			className={`${styles.previewVideoContainer} ${isVertical ? styles.previewVideoContainerVertical : ''} ${videoState.isOff ? styles.previewVideoContainerHidden : ''}`}
		>
			<DailyVideo
				automirror
				sessionId={id}
				type="video"
				className={`${styles.previewVideo} ${isVertical ? styles.previewVideoVertical : ''} ${videoState.isOff ? styles.previewVideoHidden : ''}`}
			/>
			<div className={styles.audioWaveContainer}>
				<AudioWave id={id} />
			</div>
		</div>
	);
});

const PreviewVideos = React.memo(() => {
	const localId = useLocalSessionId();
	const { isScreenSharing } = useLocalScreenshare();
	const replicaIds = useReplicaIDs();
	const replicaId = replicaIds[0];

	return (
		<>
			{isScreenSharing && (
				<VideoPreview id={replicaId} />
			)}
			<VideoPreview id={localId} />
		</>
	);
});

const MainVideo = React.memo(() => {
	const replicaIds = useReplicaIDs();
	const localId = useLocalSessionId();
	const videoState = useVideoTrack(replicaIds[0]);
	const screenVideoState = useScreenVideoTrack(localId);
	const isScreenSharing = !screenVideoState.isOff;
	// This is one-to-one call, so we can use the first replica id
	const replicaId = replicaIds[0];

	if (!replicaId) {
		return (
			<div className={styles.waitingContainer}>
				<p>Connecting...</p>
			</div>
		);
	}

	// Switching between replica video and screen sharing video
	return (
		<div
			className={`${styles.mainVideoContainer} ${isScreenSharing ? styles.mainVideoContainerScreenSharing : ''}`}
		>
			<DailyVideo
				automirror
				sessionId={isScreenSharing ? localId : replicaId}
				type={isScreenSharing ? "screenVideo" : "video"}
				className={`${styles.mainVideo}
				${isScreenSharing ? styles.mainVideoScreenSharing : ''}
				${videoState.isOff ? styles.mainVideoHidden : ''}`}
			/>
		</div>
	);
});

export const Conversation = React.memo(({ onLeave, conversationUrl }: ConversationProps) => {
	const { joinCall, leaveCall } = useCVICall();
	const meetingState = useMeetingState();
	const { hasMicError } = useDevices()
	const isE2E = process.env.NEXT_PUBLIC_E2E_TEST_MODE === 'true';
	const localId = useLocalSessionId();
	const debugDaily = process.env.NEXT_PUBLIC_DEBUG_DAILY === 'true';

	// Guard to prevent double-calling onLeave (can happen if user clicks leave button
	// which triggers both handleLeave and the left-meeting event)
	const hasCalledOnLeaveRef = useRef(false);

	// Debug meeting state
	useEffect(() => {
		if (debugDaily) console.log('🎯 CVI Meeting State:', meetingState);
		try {
			Sentry.addBreadcrumb({
				category: 'daily',
				level: 'info',
				message: 'meeting-state',
				data: { meetingState },
			});
		} catch {}
	}, [meetingState, debugDaily]);

	// Granular Daily event logging for diagnosis
	useDailyEvent('joined-meeting', (ev) => {
		if (debugDaily) {
			console.info('✅ Daily joined-meeting', {
				localSessionId: localId,
				event: ev,
				url: conversationUrl,
			});
		}
		try {
			Sentry.addBreadcrumb({
				category: 'daily',
				level: 'info',
				message: 'joined-meeting',
				data: { localSessionId: localId, url: conversationUrl },
			});
		} catch {}
	});

	useDailyEvent('left-meeting', (ev) => {
		if (debugDaily) console.info('👋 Daily left-meeting', ev);
		try {
			Sentry.addBreadcrumb({ category: 'daily', level: 'info', message: 'left-meeting' });
		} catch {}
		// When the meeting ends (either we left or got kicked), trigger onLeave callback
		// This handles cases where the remote agent ends the call
		if (!hasCalledOnLeaveRef.current) {
			hasCalledOnLeaveRef.current = true;
			if (debugDaily) console.info('👋 Calling onLeave from left-meeting event');
			onLeave();
		}
	});

	useDailyEvent('participant-joined', (ev) => {
		if (debugDaily) {
			console.log('👤 participant-joined', {
				id: ev?.participant?.session_id,
				name: ev?.participant?.user_name,
				user_id: ev?.participant?.user_id,
			});
		}
		try {
			Sentry.addBreadcrumb({
				category: 'daily',
				level: 'info',
				message: 'participant-joined',
				data: { id: ev?.participant?.session_id },
			});
		} catch {}
	});

	useDailyEvent('participant-left', (ev) => {
		if (debugDaily) {
			console.log('🚪 participant-left', {
				id: ev?.participant?.session_id,
				name: ev?.participant?.user_name,
				user_id: ev?.participant?.user_id,
			});
		}
		try {
			Sentry.addBreadcrumb({ category: 'daily', level: 'info', message: 'participant-left', data: { id: ev?.participant?.session_id } });
		} catch {}
	});

	useDailyEvent('camera-error', (ev) => {
		if (debugDaily) console.error('📷 camera-error', ev);
		try {
			Sentry.addBreadcrumb({ category: 'daily', level: 'error', message: 'camera-error' });
		} catch {}
	});

	useDailyEvent('error', (ev) => {
		if (debugDaily) console.error('🛑 daily error event', ev);
		try {
			Sentry.addBreadcrumb({ category: 'daily', level: 'error', message: 'daily-error-event' });
		} catch {}
	});

	useDailyEvent('active-speaker-change', (ev) => {
		if (debugDaily) console.log('🗣️ active-speaker-change', ev);
		try {
			Sentry.addBreadcrumb({ category: 'daily', level: 'debug', message: 'active-speaker-change' });
		} catch {}
	});

	useDailyEvent('network-quality-change', (ev) => {
		if (debugDaily) console.log('📶 network-quality-change', ev);
		try {
			Sentry.addBreadcrumb({ category: 'daily', level: 'debug', message: 'network-quality-change' });
		} catch {}
	});

	useDailyEvent('app-message', (ev) => {
		try {
			if (debugDaily) console.log('💬 app-message', typeof ev?.data === 'string' ? ev?.data : ev);
			Sentry.addBreadcrumb({ category: 'daily', level: 'info', message: 'app-message' });
		} catch (e) {
			if (debugDaily) console.log('💬 app-message (unserializable)');
		}
	});

	// Log mic access issues detected via devices hook (covers versions where 'mic-error' typed event may be missing)
	useEffect(() => {
		if (hasMicError) {
			if (debugDaily) console.error('🎙️ Microphone error detected via devices hook (hasMicError=true)');
			try {
				Sentry.addBreadcrumb({ category: 'daily', level: 'error', message: 'mic-error-detected' });
			} catch {}
		}
	}, [hasMicError, debugDaily]);

	useEffect(() => {
		if (meetingState === 'error') {
			if (debugDaily) console.warn('Daily meeting entered error state; not leaving automatically. Showing retry UI.');
			try {
				Sentry.addBreadcrumb({ category: 'daily', level: 'warning', message: 'meeting-state-error' });
			} catch {}
		}
	}, [meetingState, debugDaily]);

	// Initialize call when conversation is available
	useEffect(() => {
		if (!conversationUrl) return;
		if (isE2E || conversationUrl === 'about:blank') {
			if (debugDaily) console.log('🧪 E2E mode: Skipping Daily join');
			return;
		}
		if (debugDaily) console.log('🎥 CVI: Joining call with URL:', conversationUrl);
		try {
			Sentry.addBreadcrumb({ category: 'daily', level: 'info', message: 'join-call', data: { url: conversationUrl } });
		} catch {}
		joinCall({ url: conversationUrl });
	}, [conversationUrl, joinCall, isE2E, debugDaily]);

	// Ensure we leave the call when component unmounts to prevent lingering sessions
	useEffect(() => {
		return () => {
			if (isE2E) return; // nothing to leave in E2E
			try {
				leaveCall();
			} catch (_) {
				// no-op
			}
		};
	}, [leaveCall, isE2E]);

	const retryJoin = useCallback(() => {
		if (isE2E || conversationUrl === 'about:blank') return;
		try {
			if (debugDaily) console.log('🔁 Retrying join');
			Sentry.addBreadcrumb({ category: 'daily', level: 'info', message: 'retry-join' });
		} catch {}
		try {
			leaveCall();
		} catch (_) {
			// no-op
		}
		joinCall({ url: conversationUrl });
	}, [joinCall, leaveCall, conversationUrl, isE2E, debugDaily]);

	const handleLeave = useCallback(() => {
		try {
			Sentry.addBreadcrumb({ category: 'daily', level: 'info', message: 'manual-leave' });
		} catch {}
		leaveCall();
		// Note: onLeave will be called by the left-meeting event handler
		// but we set the flag here in case the event doesn't fire
		if (!hasCalledOnLeaveRef.current) {
			hasCalledOnLeaveRef.current = true;
			onLeave();
		}
	}, [leaveCall, onLeave]);

	return (
		<div className={styles.container}>
			<div className={styles.videoContainer}>
				{
					hasMicError && (
						<div className={styles.errorContainer}>
							<p>
								Camera or microphone access denied. Please check your settings and try again.
							</p>
						</div>
					)}

				{meetingState === 'error' && (
					<div className={styles.errorContainer}>
						<p>
							We ran into a problem joining the call. The demo will stay open. Try again below.
						</p>
						<button type="button" className={styles.leaveButton} onClick={retryJoin}>
							Retry
						</button>
					</div>
				)}

				{/* Main video */}
				<div className={styles.mainVideoContainer}>
					<MainVideo />
				</div>

				{/* Self view */}
				<div className={styles.selfViewContainer}>
					<PreviewVideos />
				</div>
			</div>

			<div className={styles.footer}>
				<div className={styles.footerControls}>
					<MicSelectBtn />
					<CameraSelectBtn />
					<ScreenShareButton />
					<button type="button" className={styles.leaveButton} onClick={handleLeave}>
						<span className={styles.leaveButtonIcon}>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								role="img"
								aria-label="Leave Call"
							>
								<path
									d="M18 6L6 18M6 6L18 18"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</svg>
						</span>
					</button>
				</div>
			</div>

			<DailyAudio />
		</div>
	);
});
