import React, { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { SystemUpdate } from '../services/updates.service';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  updates: SystemUpdate[];
}

const getYouTubeEmbedUrl = (url: string): string | null => {
  const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
  const longMatch = url.match(/youtube\.com\/watch\?v=([^&]+)/);
  if (longMatch) return `https://www.youtube.com/embed/${longMatch[1]}`;
  if (url.includes('youtube.com/embed/')) return url;
  return null;
};

const isYouTubeUrl = (url: string): boolean =>
  url.includes('youtube.com') || url.includes('youtu.be');

const SystemUpdatesModal: React.FC<Props> = ({ isOpen, onClose, updates }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!updates.length) return null;

  const current = updates[currentIndex];
  const total = updates.length;

  const goPrev = () => setCurrentIndex((i) => Math.max(0, i - 1));
  const goNext = () => setCurrentIndex((i) => Math.min(total - 1, i + 1));

  const handleClose = () => {
    setCurrentIndex(0);
    onClose();
  };

  const renderVideo = (videoUrl: string) => {
    if (isYouTubeUrl(videoUrl)) {
      const embedUrl = getYouTubeEmbedUrl(videoUrl);
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
    return (
      <video
        src={videoUrl}
        controls
        className="w-full aspect-video rounded-lg bg-black"
      />
    );
  };

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
              <Dialog.Panel className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-200">
                {/* Botón cerrar — fuera del video, en el borde superior del panel */}
                <div className="flex justify-end px-3 pt-3 pb-0">
                  <button
                    onClick={handleClose}
                    className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>

                {/* Navegación multi-slide — flechas sobre el video */}
                {total > 1 && currentIndex > 0 && (
                  <button
                    onClick={goPrev}
                    className="absolute left-3 top-[calc(50%-60px)] z-10 p-1.5 rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors"
                  >
                    <ChevronLeftIcon className="w-5 h-5" />
                  </button>
                )}
                {total > 1 && currentIndex < total - 1 && (
                  <button
                    onClick={goNext}
                    className="absolute right-3 top-[calc(50%-60px)] z-10 p-1.5 rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors"
                  >
                    <ChevronRightIcon className="w-5 h-5" />
                  </button>
                )}

                {/* Área de video */}
                {current.video_url && (
                  <div className="p-4 pb-0">
                    {renderVideo(current.video_url)}
                  </div>
                )}

                {/* Área de contenido */}
                <div className="p-6 md:p-8">
                  {/* Título + badge */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <Dialog.Title className="text-slate-900 tracking-tight text-2xl font-bold leading-tight">
                      {current.title}
                    </Dialog.Title>
                    <span className="shrink-0 px-2 py-1 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest rounded">
                      {current.version}
                    </span>
                  </div>

                  {/* Fecha */}
                  <p className="text-xs text-slate-400 mb-4">{current.release_date}</p>

                  {/* Estado del carrusel para dejar claro cuantas novedades hay */}
                  <p className="text-xs text-slate-500 mb-4 font-medium">
                    Novedad {currentIndex + 1} de {total}
                  </p>

                  {/* Descripción */}
                  <p className="text-slate-600 text-base leading-relaxed mb-8">
                    {current.description}
                  </p>

                  {/* Botones de acción */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    {currentIndex < total - 1 ? (
                      <button
                        onClick={goNext}
                        className="flex min-w-[140px] cursor-pointer items-center justify-center rounded-lg h-12 px-6 bg-primary text-white text-base font-semibold transition-all hover:bg-primary/90 hover:shadow-md active:scale-95"
                      >
                        Siguiente
                      </button>
                    ) : (
                      <button
                        onClick={handleClose}
                        className="flex min-w-[140px] cursor-pointer items-center justify-center rounded-lg h-12 px-6 bg-primary text-white text-base font-semibold transition-all hover:bg-primary/90 hover:shadow-md active:scale-95"
                      >
                        Entendido
                      </button>
                    )}
                    {current.learn_more_url && (
                      <a
                        href={current.learn_more_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex min-w-[140px] cursor-pointer items-center justify-center rounded-lg h-12 px-6 bg-slate-100 text-slate-700 text-base font-semibold transition-all hover:bg-slate-200"
                      >
                        Más detalles
                      </a>
                    )}
                  </div>

                  {/* Dots de progreso — solo si hay más de 1 slide */}
                  {total > 1 && (
                    <div className="flex items-center gap-2 mt-6">
                      {updates.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentIndex(idx)}
                          aria-label={`Ir al slide ${idx + 1}`}
                          className={`rounded-full transition-all duration-200 focus:outline-none ${
                            idx === currentIndex
                              ? 'w-6 h-2.5 bg-primary'
                              : 'w-2.5 h-2.5 bg-slate-300 hover:bg-slate-400'
                          }`}
                        />
                      ))}
                      <span className="text-xs text-slate-400 ml-1">
                        {currentIndex + 1} / {total}
                      </span>
                    </div>
                  )}
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
