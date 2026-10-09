import { analyzePixels, evaluateScene } from '@/lib/sceneEngine';
import type { SceneAssessment } from '@/types';
import { useEffect, useRef, useState } from 'react';

const CAMERA_TIMEOUT_MS = 10_000;
const CAPTURE_WIDTH = 160;
const CAPTURE_HEIGHT = 120;

export function useCamera(onResult: (result: SceneAssessment) => void) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mountedRef = useRef(true);
  const [active, setActive] = useState(false);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);

  const stop = () => {
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    if (mountedRef.current) {
      setActive(false);
      setScanning(false);
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      streamRef.current?.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, []);

  const start = async () => {
    setError('');
    if (!window.isSecureContext && location.hostname !== 'localhost') {
      setError('摄像头需要 HTTPS 安全环境，请使用手动模拟扫描。');
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('此浏览器没有可用摄像头接口，请使用手动模拟扫描。');
      return;
    }

    let timedOut = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const mediaRequest = navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' } },
      audio: false,
    });
    mediaRequest
      .then(stream => {
        if (timedOut || !mountedRef.current)
          stream.getTracks().forEach(track => track.stop());
      })
      .catch(() => undefined);

    try {
      const timeout = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          timedOut = true;
          reject(new Error('timeout'));
        }, CAMERA_TIMEOUT_MS);
      });
      const stream = await Promise.race([mediaRequest, timeout]);
      if (timeoutId) clearTimeout(timeoutId);
      if (!mountedRef.current) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      streamRef.current?.getTracks().forEach(track => track.stop());
      streamRef.current = stream;
      if (!videoRef.current) {
        stop();
        return;
      }
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setActive(true);
    } catch (cause) {
      if (timeoutId) clearTimeout(timeoutId);
      if (!mountedRef.current) return;
      if (cause instanceof DOMException && cause.name === 'NotAllowedError') {
        setError('摄像头权限被拒绝。你可在浏览器设置中开启，或使用手动模拟。');
      } else if (cause instanceof Error && cause.message === 'timeout') {
        setError('摄像头启动超时，请重试或使用手动模拟。');
      } else if (
        cause instanceof DOMException &&
        cause.name === 'NotFoundError'
      ) {
        setError('没有检测到可用摄像头，请使用手动模拟扫描。');
      } else {
        setError('无法连接摄像头，请检查设备占用情况。');
      }
      stop();
    }
  };

  const scan = async () => {
    const video = videoRef.current;
    if (
      !video ||
      !active ||
      video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA
    ) {
      setError('摄像头画面尚未就绪，请稍后重试。');
      return;
    }
    setError('');
    setScanning(true);
    await new Promise(resolve => setTimeout(resolve, 950));
    if (!mountedRef.current || !streamRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = CAPTURE_WIDTH;
    canvas.height = CAPTURE_HEIGHT;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) {
      setScanning(false);
      setError('当前浏览器无法分析画面，请使用手动模拟扫描。');
      return;
    }
    try {
      context.drawImage(video, 0, 0, CAPTURE_WIDTH, CAPTURE_HEIGHT);
      const pixels = context.getImageData(
        0,
        0,
        CAPTURE_WIDTH,
        CAPTURE_HEIGHT,
      ).data;
      onResult(
        evaluateScene(analyzePixels(pixels, CAPTURE_WIDTH, CAPTURE_HEIGHT)),
      );
    } catch {
      setError('读取摄像头画面失败，请重试或使用手动模拟。');
    } finally {
      if (mountedRef.current) setScanning(false);
    }
  };

  return { videoRef, active, error, scanning, start, stop, scan };
}
