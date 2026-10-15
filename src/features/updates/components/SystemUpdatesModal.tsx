import React, { useEffect, useState } from 'react';
import UpdateGuide, { safeUpdateLink } from './UpdateGuide';
import { Dialog, Transition } from '@headlessui/react';
import {
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SparklesIcon,
  ShieldCheckIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import { SystemUpdate } from '../services/updates.service';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  updates: SystemUpdate[];
  onView?: (update: SystemUpdate) => void;
  onAcknowledge?: (update: SystemUpdate) => void;
}

const getYouTubeEmbedUrl = (url: string): string | null => {
  const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
  const longMatch = url.match(/youtube\.com\/watch\?v=([^&]+)/);
  if (longMatch) return `https://www.youtube.com/embed/${longMatch[1]}`;
  if (url.includes('youtube.com/embed/')) return url;
  return null;
};

const getVimeoEmbedUrl = (url: string): string | null => {
  const playerMatch = url.match(/player\.vimeo\.com\/video\/(\d+)/);
  if (playerMatch) return `https://player.vimeo.com/video/${playerMatch[1]}`;

  const vimeoMatch = url.match(/vimeo\.com\/(?:.*\/)?(\d+)(?:$|\?)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

  return null;
};

const isYouTubeUrl = (url: string): boolean =>
  url.includes('youtube.com') || url.includes('youtu.be');

const isVimeoUrl = (url: string): boolean =>
  url.includes('vimeo.com') || url.includes('player.vimeo.com');

const SystemUpdatesModal: React.FC<Props> = ({ isOpen, onClose, updates, onView, onAcknowledge }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  useEffect(() => { setZoomed(false); }, [currentIndex, isOpen]);

  const total = updates.length;

  useEffect(() => {
    if (!total) return;
    if (!isOpen) return;
    setCurrentIndex((prev) => Math.min(prev, total - 1));
  }, [isOpen, total]);

  const current = updates[Math.min(currentIndex, total - 1)];
  useEffect(() => {
    if (isOpen && current) onView?.(current);
  }, [isOpen, current, onView]);

  if (!total) return null;
  const learnMore = safeUpdateLink(current.learn_more_url);

  const goPrev = () => setCurrentIndex((i) => Math.max(0, i - 1));
  const goNext = () => setCurrentIndex((i) => Math.min(total - 1, i + 1));

  const handleClose = () => {
    setCurrentIndex(0);
    onClose();
  };

  const handleUnderstood = () => {
    onAcknowledge?.(current);
    if (currentIndex < total - 1) goNext();
    else handleClose();
  };

  const renderVideo = (videoUrl: string) => {
    if (isYouTubeUrl(videoUrl)) {
      const baseEmbedUrl = getYouTubeEmbedUrl(videoUrl);
      if (!baseEmbedUrl) return null;
      const separator = baseEmbedUrl.includes('?') ? '&' : '?';
      const embedUrl = `${baseEmbedUrl}${separator}rel=0&modestbranding=1&playsinline=1&vq=hd1080`;
      if (!embedUrl) return null;
      return (
        <iframe
          src={embedUrl}
          title={current.title}
          className="w-full aspect-video rounded-lg"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      );
    }

    if (isVimeoUrl(videoUrl)) {
      const baseEmbedUrl = getVimeoEmbedUrl(videoUrl);
      if (!baseEmbedUrl) return null;
      const separator = baseEmbedUrl.includes('?') ? '&' : '?';
      const embedUrl = `${baseEmbedUrl}${separator}title=0&byline=0&portrait=0`;
      return (
        <iframe
          src={embedUrl}
          title={current.title}
          className="w-full aspect-video rounded-lg"
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
          allowFullScreen
        />
      );
    }

    return (
      <video
        src={videoUrl}
        controls
        preload="metadata"
        className="w-full aspect-video rounded-lg bg-black"
      />
    );
  };

  const announcementImage = safeUpdateLink(current.image_url);
  if (announcementImage) return <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true" />
    <div className="fixed inset-0 flex items-center justify-center p-2 sm:p-4">
      <Dialog.Panel onKeyDown={event => { if (event.key === 'ArrowRight') goNext(); if (event.key === 'ArrowLeft') goPrev(); }} className="relative w-full max-w-[1500px] h-[94dvh] rounded-2xl bg-slate-950 text-white shadow-2xl flex flex-col overflow-hidden">
        <Dialog.Title className="sr-only">{current.title}</Dialog.Title>
        <button onClick={handleClose} aria-label="Cerrar" className="absolute right-3 top-3 z-10 p-2 rounded-full bg-black/70 text-white hover:bg-black"><XMarkIcon className="w-5 h-5" /></button>
        <div key={`${current.id}-${zoomed}`} className="flex-1 min-h-0 overflow-auto">
          <button type="button" onClick={() => setZoomed(value => !value)} aria-label={zoomed ? 'Reducir imagen' : 'Ampliar imagen'} aria-pressed={zoomed} className={zoomed ? 'block w-[200%] min-h-full cursor-zoom-out' : 'flex w-full h-full items-center justify-center cursor-zoom-in'}>
            <img src={announcementImage} alt={current.title} draggable={false} className={zoomed ? 'block w-full max-w-none' : 'w-full h-full object-contain'} />
          </button>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 shrink-0 bg-slate-950">
          <div className="flex items-center gap-2"><button onClick={goPrev} disabled={currentIndex === 0} aria-label="Anterior" className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-30"><ChevronLeftIcon className="w-5 h-5" /></button>
            <div className="flex flex-wrap gap-2">{updates.map((item, index) => <button key={item.id} aria-label={`Ir a la novedad ${index + 1}`} aria-current={index === currentIndex ? 'true' : undefined} onClick={() => setCurrentIndex(index)} className={`w-2.5 h-2.5 rounded-full ${index === currentIndex ? 'bg-blue-400' : 'bg-slate-600'}`} />)}</div>
            <button onClick={goNext} disabled={currentIndex === total - 1} aria-label="Siguiente" className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-30"><ChevronRightIcon className="w-5 h-5" /></button>
          </div>
          <div className="flex items-center gap-3">{learnMore && <a href={learnMore} target={learnMore.startsWith('/') ? undefined : '_blank'} rel="noopener noreferrer" onClick={handleClose} className="text-sm font-semibold text-blue-300 hover:text-white">{learnMore.startsWith('/') ? 'Abrir herramienta' : 'Más detalles'}</a>}<button onClick={handleUnderstood} className="rounded-lg bg-primary text-white px-4 py-2 text-sm font-semibold">{currentIndex < total - 1 ? 'Entendido y siguiente' : 'Entendido'}</button></div>
        </div>
      </Dialog.Panel>
    </div>
  </Dialog>;

  return (
    <Transition show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        {/* Backdrop */}
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="relative w-full max-w-7xl bg-dm-bg-secondary rounded-2xl shadow-2xl overflow-hidden border border-dm-border-primary">
                <div className="absolute right-4 top-4 z-20">
                  <button
                    onClick={handleClose}
                    className="p-2 rounded-full bg-dm-bg-primary/90 hover:bg-dm-bg-primary text-dm-text-muted hover:text-dm-text-secondary transition-colors shadow-sm"
                    aria-label="Cerrar"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-col md:flex-row min-h-[620px]">
                  <div className="relative md:w-4/12 bg-gradient-to-br from-primary/15 via-blue-100/50 to-indigo-100/50 dark:from-primary/10 dark:via-blue-900/20 dark:to-indigo-900/20 border-b md:border-b-0 md:border-r border-dm-border-primary p-6 md:p-8">
                    <div className="absolute -top-12 -right-10 w-40 h-40 rounded-full bg-primary/10" />
                    <div className="absolute -bottom-16 -left-10 w-56 h-56 rounded-full bg-sky-200/40" />

                    <div className="relative z-10 h-full flex flex-col justify-between">
                      <div>
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-dm-bg-primary/80 border border-primary/20 text-primary text-xs font-bold tracking-wide uppercase">
                          <SparklesIcon className="w-4 h-4" />
                          Actualizacion
                        </span>

                        <div className="mt-8 w-20 h-20 rounded-full bg-dm-bg-primary shadow-lg flex items-center justify-center">
                          <ShieldCheckIcon className="w-10 h-10 text-primary" />
                        </div>

                        <Dialog.Title className="mt-6 text-2xl font-extrabold tracking-tight text-dm-text-primary leading-tight">
                          {current.title}
                        </Dialog.Title>

                        <p className="mt-4 text-sm text-dm-text-secondary">Conoce qué cambió y cómo usarlo, paso a paso.</p>
                      </div>

                      <div className="mt-8 p-4 rounded-xl bg-dm-bg-primary/80 border border-dm-border-primary">
                        <p className="text-xs font-semibold uppercase tracking-wider text-dm-text-muted">Progreso</p>
                        <p className="mt-1 text-sm font-semibold text-dm-text-primary">
                          Novedad {currentIndex + 1} de {total}
                        </p>
                        <div className="mt-3 flex items-center gap-2">
                          {updates.map((_, idx) => (
                            <button
                              key={idx}
                              onClick={() => setCurrentIndex(idx)}
                              aria-label={`Ir a la novedad ${idx + 1}`}
                              className={`rounded-full transition-all duration-200 focus:outline-none ${
                                idx === currentIndex
                                  ? 'w-7 h-2.5 bg-primary'
                                  : 'w-2.5 h-2.5 bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="md:w-8/12 p-6 md:p-10 flex flex-col">
                    <div className="flex items-start justify-between gap-3 mb-3 pr-8">
                      <span className="inline-flex shrink-0 rounded-full px-3 py-1 bg-primary/10 text-primary text-[11px] font-extrabold uppercase tracking-wider">
                        {current.version}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1 text-xs text-dm-text-muted">
                          <CalendarDaysIcon className="w-4 h-4" />
                          {current.release_date}
                        </span>
                        {total > 1 && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={goPrev}
                              disabled={currentIndex === 0}
                              className="p-1.5 rounded-full border border-dm-border-primary bg-dm-bg-primary text-dm-text-secondary hover:bg-dm-bg-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                              aria-label="Anterior"
                            >
                              <ChevronLeftIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={goNext}
                              disabled={currentIndex === total - 1}
                              className="p-1.5 rounded-full border border-dm-border-primary bg-dm-bg-primary text-dm-text-secondary hover:bg-dm-bg-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                              aria-label="Siguiente"
                            >
                              <ChevronRightIcon className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 max-h-[55vh] overflow-y-auto pr-1">{safeUpdateLink(current.image_url) && <img src={safeUpdateLink(current.image_url)} alt={current.title} className="w-full rounded-xl mb-4" loading="lazy" />}<UpdateGuide text={current.description || ''} /></div>
                    {current.video_url?.trim() && <details className="mt-5"><summary className="cursor-pointer font-semibold text-primary">Ver video complementario</summary><div className="mt-3 rounded-xl overflow-hidden border border-dm-border-primary bg-black">{renderVideo(current.video_url)}</div></details>}

                    <div className="mt-auto pt-6 flex flex-col sm:flex-row gap-3">
                      <button onClick={handleUnderstood} className="flex min-w-[160px] cursor-pointer items-center justify-center rounded-xl h-12 px-6 bg-primary text-white text-base font-semibold transition-all hover:bg-primary/90 hover:shadow-md active:scale-95">
                        {currentIndex < total - 1 ? 'Entendido y siguiente' : 'Entendido'}
                      </button>
                      {learnMore && (
                        <a
                          href={learnMore}
                          target={learnMore.startsWith('/') ? undefined : '_blank'}
                          onClick={handleClose}
                          rel="noopener noreferrer"
                          className="flex min-w-[160px] cursor-pointer items-center justify-center rounded-xl h-12 px-6 border border-dm-border-primary bg-dm-bg-primary text-dm-text-secondary text-base font-semibold transition-all hover:bg-dm-bg-hover"
                        >
                          {learnMore.startsWith('/') ? 'Abrir herramienta' : 'Más detalles'}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default SystemUpdatesModal;
