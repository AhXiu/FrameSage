import { POSE_PLANS } from '@/data/poses';
import {
  buildPosePreviewPrompt,
  generatePosePreview,
  supportsReferenceImages,
  validateImageGenerationConfig,
} from '@/lib/imageGeneration';
import { compressImage, validateImageFile } from '@/lib/imageProcessing';
import { personalizePosePlans } from '@/lib/personalizedPoses';
import {
  loadImageGenerationAppKey,
  loadImageGenerationConfig,
} from '@/lib/storage';
import { requestVisionAnalysis } from '@/lib/visionClient';
import type {
  ClothingType,
  EnvironmentFeature,
  EnvironmentProfile,
  OutfitProfile,
  OutfitStyle,
  PortraitContextAnalysis,
  PosePlan,
  SceneId,
} from '@/types';
import {
  Camera,
  Download,
  ImagePlus,
  RotateCcw,
  Sparkles,
  Trash2,
  XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

const STYLES: OutfitStyle[] = ['清新', '通勤', '复古', '街头', '优雅', '休闲'];
const CLOTHING: ClothingType[] = ['裙装', '裤装', '长外套', '短外套', '运动装'];
const ENVIRONMENT: EnvironmentFeature[] = [
  '窗边',
  '墙面',
  '座椅',
  '栏杆',
  '街道',
  '树木',
  '开阔空间',
];
interface TemporaryImage {
  blob: Blob;
  previewUrl: string;
}

export function PersonalizedPoseWorkspace({
  scene,
  selectedPlan,
  applied,
  onApply,
  onRestore,
}: {
  scene: SceneId;
  selectedPlan: PosePlan;
  applied: boolean;
  onApply: (plans: PosePlan[]) => void;
  onRestore: () => void;
}) {
  const [environmentImage, setEnvironmentImage] =
    useState<TemporaryImage | null>(null);
  const [modelImage, setModelImage] = useState<TemporaryImage | null>(null);
  const [styles, setStyles] = useState<string[]>([]);
  const [clothing, setClothing] = useState<string[]>([]);
  const [features, setFeatures] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState<PortraitContextAnalysis | null>(
    null,
  );
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [generationConfig] = useState(loadImageGenerationConfig);
  const [appKey] = useState(loadImageGenerationAppKey);
  const [generationConsent, setGenerationConsent] = useState(false);
  const [generationBusy, setGenerationBusy] = useState(false);
  const [generationMessage, setGenerationMessage] = useState('');
  const [generatedImages, setGeneratedImages] = useState<
    Record<string, string>
  >({});
  const generationController = useRef<AbortController | null>(null);
  const imagesRef = useRef<(TemporaryImage | null)[]>([null, null]);
  imagesRef.current = [environmentImage, modelImage];
  useEffect(
    () => () => {
      generationController.current?.abort();
      for (const image of imagesRef.current) {
        if (image) URL.revokeObjectURL(image.previewUrl);
      }
    },
    [],
  );

  const localProfiles = useMemo(
    () => buildProfiles(styles, clothing, features),
    [styles, clothing, features],
  );
  const profiles = analysis
    ? mergeManualCorrections(analysis, localProfiles)
    : localProfiles;
  const state =
    analysis?.source === 'vision'
      ? 'vision'
      : environmentImage || modelImage
        ? 'manual'
        : 'empty';
  const sendsReferences = supportsReferenceImages(generationConfig.provider);
  const generationConfigErrors = validateImageGenerationConfig(
    generationConfig,
    appKey,
  );
  const generatedImage = generatedImages[selectedPlan.id];

  const generatePreview = async () => {
    if (generationConfigErrors.length) {
      setGenerationMessage(
        `${generationConfigErrors[0]} 请前往设置页完成配置。`,
      );
      return;
    }
    if (sendsReferences && (!environmentImage || !modelImage)) {
      setGenerationMessage(
        'Seedream 多参考图预览需要先提供环境图和模特全身图。',
      );
      return;
    }
    if (sendsReferences && !generationConsent) {
      setGenerationMessage('请先勾选确认本次发送两张压缩参考图。');
      return;
    }
    const controller = new AbortController();
    generationController.current = controller;
    setGenerationBusy(true);
    setGenerationMessage('正在生成写实姿势预览…');
    const result = await generatePosePreview(
      generationConfig,
      appKey,
      buildPosePreviewPrompt(
        selectedPlan,
        profiles.outfit,
        profiles.environment,
      ),
      environmentImage && modelImage
        ? [environmentImage.blob, modelImage.blob]
        : [],
      { signal: controller.signal },
    );
    if (result.ok) {
      setGeneratedImages(current => ({
        ...current,
        [selectedPlan.id]: result.imageUrl,
      }));
      setGenerationMessage(
        result.usedReferenceImages
          ? '生成完成。两张图片仅作为本次 AI 示意的参考。'
          : '生成完成。该提供商仅使用文本提示，未上传参考图。',
      );
    } else {
      setGenerationMessage(result.message);
    }
    setGenerationBusy(false);
    generationController.current = null;
  };

  const replaceImage = async (
    file: File,
    current: TemporaryImage | null,
    setter: (value: TemporaryImage | null) => void,
  ) => {
    const validation = validateImageFile(file);
    if (validation) {
      setMessage(validation);
      return;
    }
    setBusy(true);
    setMessage('正在压缩图片…');
    try {
      const blob = await compressImage(file);
      if (current) URL.revokeObjectURL(current.previewUrl);
      setter({ blob, previewUrl: URL.createObjectURL(blob) });
      setAnalysis(null);
      setMessage('图片已在浏览器内压缩，仅当前页面临时使用。');
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : '图片处理失败，请重试。',
      );
    } finally {
      setBusy(false);
    }
  };
  const removeImage = (
    current: TemporaryImage | null,
    setter: (value: TemporaryImage | null) => void,
  ) => {
    if (current) URL.revokeObjectURL(current.previewUrl);
    setter(null);
    setAnalysis(null);
    setMessage('图片已从当前页面移除。');
  };
  const analyze = async () => {
    if (!environmentImage || !modelImage) {
      setMessage('请先同时提供环境图和模特全身图。');
      return;
    }
    setBusy(true);
    setMessage('正在请求视觉分析…');
    const result = await requestVisionAnalysis(
      environmentImage.blob,
      modelImage.blob,
    );
    if (result.ok) {
      setAnalysis(result.analysis);
      setMessage('视觉分析完成，你仍可用标签修正。');
    } else {
      setAnalysis(null);
      setMessage(result.message);
    }
    setBusy(false);
  };
  const apply = () => {
    const hasTags =
      profiles.outfit.styles.length +
        profiles.outfit.clothingTypes.length +
        profiles.environment.usableObjects.length +
        profiles.environment.spaces.length +
        profiles.environment.backgroundStructures.length >
      0;
    if (!analysis && !hasTags) {
      setMessage(
        '本地辅助模式不会猜测图片内容，请至少选择一个穿搭或环境标签。',
      );
      return;
    }
    onApply(
      personalizePosePlans(
        POSE_PLANS,
        scene,
        profiles.outfit,
        profiles.environment,
      ),
    );
    setMessage('已将个性化排序应用到当前姿势卡。');
  };

  return (
    <section className="personal-workspace" aria-labelledby="personal-title">
      <div className="section-title">
        <div>
          <span className="eyebrow">TEMPORARY PORTRAIT CONTEXT</span>
          <h2 id="personal-title">个性化姿势工作区</h2>
        </div>
        <span className={`workspace-state ${state}`}>
          {state === 'empty'
            ? '未提供图片'
            : state === 'vision'
              ? '已获得视觉分析'
              : '本地辅助'}
        </span>
      </div>
      <p className="privacy-copy">
        图片仅在当前页面临时处理，不写入
        localStorage、不进入收藏；收藏只保存姿势结果和文本。
      </p>
      <div className="image-input-grid">
        <ImageInput
          title="环境图"
          hint="相册或后置拍摄"
          capture="environment"
          image={environmentImage}
          disabled={busy}
          onFile={file =>
            replaceImage(file, environmentImage, setEnvironmentImage)
          }
          onRemove={() => removeImage(environmentImage, setEnvironmentImage)}
        />
        <ImageInput
          title="模特全身图"
          hint="相册或前置拍摄"
          capture="user"
          image={modelImage}
          disabled={busy}
          onFile={file => replaceImage(file, modelImage, setModelImage)}
          onRemove={() => removeImage(modelImage, setModelImage)}
        />
      </div>
      <button
        className="vision-action"
        type="button"
        disabled={busy || !environmentImage || !modelImage}
        onClick={analyze}
      >
        <Sparkles size={17} />
        {busy ? '处理中…' : '尝试视觉分析'}
      </button>
      <p className="service-note">
        仅配置 visionEndpoint
        后才会发送两张压缩图；未配置或失败时明确回退本地标签，不会伪称识别成功。
      </p>
      {message && <output className="workspace-message">{message}</output>}
      {analysis && (
        <div className="analysis-summary">
          <b>分析摘要（可信度 {Math.round(analysis.confidence * 100)}%）</b>
          <span>{analysis.summary}</span>
        </div>
      )}
      <TagGroup
        label="穿搭风格"
        values={STYLES}
        selected={styles}
        onChange={setStyles}
      />
      <TagGroup
        label="服装"
        values={CLOTHING}
        selected={clothing}
        onChange={setClothing}
      />
      <TagGroup
        label="环境"
        values={ENVIRONMENT}
        selected={features}
        onChange={setFeatures}
      />
      <div className="generation-preview" aria-label="写实姿势预览生成">
        <div className="generation-preview-head">
          <div>
            <b>当前推荐：{selectedPlan.name}</b>
            <small>{generationConfig.displayName}</small>
          </div>
          <span>AI 示意</span>
        </div>
        <p className="service-note">
          {sendsReferences
            ? '生成时会把当前两张压缩图片发送给你选择的提供商，仅作为参考；结果不保证人物完全一致。'
            : '当前提供商仅支持文本提示生成，不上传参考图，也不会声称保留模特一致性。'}
        </p>
        {sendsReferences && (
          <label className="generation-consent">
            <input
              type="checkbox"
              checked={generationConsent}
              onChange={event =>
                setGenerationConsent(event.currentTarget.checked)
              }
            />
            我已确认本次将环境图与模特图发送给 {generationConfig.displayName}
          </label>
        )}
        {generatedImage && (
          <div className="generated-result">
            <img
              src={generatedImage}
              alt={`${selectedPlan.name}的 AI 写实姿势示意`}
            />
            <div>
              <a
                href={generatedImage}
                download={`framesage-${selectedPlan.id}.png`}
              >
                <Download size={16} /> 下载 / 打开图片
              </a>
              <button
                type="button"
                onClick={() =>
                  setGeneratedImages(current => {
                    const next = { ...current };
                    delete next[selectedPlan.id];
                    return next;
                  })
                }
              >
                <Trash2 size={16} /> 删除
              </button>
            </div>
          </div>
        )}
        <div className="generation-actions">
          <button
            type="button"
            className="primary"
            disabled={
              generationBusy ||
              generationConfigErrors.length > 0 ||
              (sendsReferences &&
                (!environmentImage || !modelImage || !generationConsent))
            }
            onClick={generatePreview}
            aria-label={
              generatedImage ? '重新生成写实姿势预览' : '生成写实姿势预览'
            }
          >
            <Sparkles size={17} />
            {generationBusy
              ? '生成中…'
              : generatedImage
                ? '重新生成'
                : '生成写实姿势预览'}
          </button>
          {generationBusy && (
            <button
              type="button"
              className="secondary"
              onClick={() => generationController.current?.abort()}
              aria-label="取消图片生成"
            >
              <XCircle size={17} /> 取消
            </button>
          )}
        </div>
        {generationConfigErrors.length > 0 && (
          <p className="generation-error">
            {generationConfigErrors[0]} 请在“设置 → 图片生成服务”中配置。
          </p>
        )}
        {generationMessage && (
          <output className="workspace-message">{generationMessage}</output>
        )}
      </div>
      <div className="workspace-actions">
        <button type="button" className="primary" onClick={apply}>
          <Sparkles size={17} />
          应用个性化排序
        </button>
        {applied && (
          <button type="button" className="secondary" onClick={onRestore}>
            <RotateCcw size={17} />
            回到原推荐
          </button>
        )}
      </div>
    </section>
  );
}

function ImageInput({
  title,
  hint,
  capture,
  image,
  disabled,
  onFile,
  onRemove,
}: {
  title: string;
  hint: string;
  capture: 'user' | 'environment';
  image: TemporaryImage | null;
  disabled: boolean;
  onFile: (file: File) => void;
  onRemove: () => void;
}) {
  return (
    <div className="image-input-card">
      {image ? (
        <img src={image.previewUrl} alt={`${title}临时预览`} />
      ) : (
        <div className="image-placeholder">
          <Camera />
          <b>{title}</b>
          <small>{hint}</small>
        </div>
      )}
      <div>
        <label className="image-pick">
          <ImagePlus size={16} />
          {image ? '替换' : '选择 / 拍摄'}
          <input
            disabled={disabled}
            type="file"
            accept="image/*"
            capture={capture}
            onChange={event => {
              const file = event.currentTarget.files?.[0];
              if (file) onFile(file);
              event.currentTarget.value = '';
            }}
            aria-label={`${title}：${image ? '替换图片' : hint}`}
          />
        </label>
        {image && (
          <button type="button" onClick={onRemove} aria-label={`删除${title}`}>
            <Trash2 size={16} />
            删除
          </button>
        )}
      </div>
    </div>
  );
}

function TagGroup({
  label,
  values,
  selected,
  onChange,
}: {
  label: string;
  values: readonly string[];
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  return (
    <div className="tag-group">
      <b>{label}</b>
      <div>
        {values.map(value => (
          <button
            type="button"
            key={value}
            aria-pressed={selected.includes(value)}
            onClick={() =>
              onChange(
                selected.includes(value)
                  ? selected.filter(item => item !== value)
                  : [...selected, value],
              )
            }
          >
            {value}
          </button>
        ))}
      </div>
    </div>
  );
}

function buildProfiles(
  styles: string[],
  clothing: string[],
  features: string[],
): { outfit: OutfitProfile; environment: EnvironmentProfile } {
  return {
    outfit: {
      styles,
      clothingTypes: clothing,
      footwearAccessories: [],
      movementRestrictions: [],
    },
    environment: {
      usableObjects: features.filter(value => ['座椅', '栏杆'].includes(value)),
      spaces: features.filter(value => ['街道', '开阔空间'].includes(value)),
      backgroundStructures: features.filter(value =>
        ['墙面', '树木'].includes(value),
      ),
      lightTendencies: features.filter(value => value === '窗边'),
    },
  };
}

function mergeManualCorrections(
  analysis: PortraitContextAnalysis,
  manual: { outfit: OutfitProfile; environment: EnvironmentProfile },
) {
  const unique = (a: string[], b: string[]) => [...new Set([...a, ...b])];
  return {
    outfit: {
      clothingTypes: unique(
        analysis.outfit.clothingTypes,
        manual.outfit.clothingTypes,
      ),
      styles: unique(analysis.outfit.styles, manual.outfit.styles),
      footwearAccessories: analysis.outfit.footwearAccessories,
      movementRestrictions: analysis.outfit.movementRestrictions,
    },
    environment: {
      usableObjects: unique(
        analysis.environment.usableObjects,
        manual.environment.usableObjects,
      ),
      spaces: unique(analysis.environment.spaces, manual.environment.spaces),
      backgroundStructures: unique(
        analysis.environment.backgroundStructures,
        manual.environment.backgroundStructures,
      ),
      lightTendencies: unique(
        analysis.environment.lightTendencies,
        manual.environment.lightTendencies,
      ),
    },
  };
}
