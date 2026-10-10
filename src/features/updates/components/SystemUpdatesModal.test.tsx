import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import SystemUpdatesModal from './SystemUpdatesModal';
import { safeUpdateLink } from './UpdateGuide';
import { SystemUpdate } from '../services/updates.service';

afterEach(cleanup);
const announcement: SystemUpdate = { id: 1, title: 'Reprograma tu pasaje', description: 'Conserva el pago.\n1. Abre la boleta.\n2. Elige una nueva fecha.', version: '2026.10.09', release_date: '2026-10-09', video_url: null, learn_more_url: '/accounting/reprogramming', platform: 'WEB', is_active: true, is_mandatory: false, created_at: '', updated_at: '' };
describe('Novedades sin video', () => {
  it('muestra el anuncio, los pasos y acceso directo sin necesitar video', () => {
    render(<SystemUpdatesModal isOpen onClose={() => {}} updates={[announcement]} />);
    expect(screen.getByText('Reprograma tu pasaje')).toBeInTheDocument();
    expect(screen.getByText('Abre la boleta.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Abrir herramienta' })).toHaveAttribute('href', '/accounting/reprogramming');
    expect(screen.queryByText('Ver video complementario')).not.toBeInTheDocument();
  });
  it('permite navegar por anuncios de texto y de video mezclados', () => {
    render(<SystemUpdatesModal isOpen onClose={() => {}} updates={[announcement, { ...announcement, id: 2, title: 'Otro cambio', video_url: 'https://youtu.be/example' }]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ir a la novedad 2' }));
    expect(screen.getByText('Otro cambio')).toBeInTheDocument();
    expect(screen.getByText('Ver video complementario')).toBeInTheDocument();
  });
  it('muestra la imagen del anuncio sin necesitar un video', () => {
    render(<SystemUpdatesModal isOpen onClose={() => {}} updates={[{ ...announcement, image_url: '/images/updates/reprogramacion-pasajes.png' }]} />);
    expect(screen.getByRole('img', { name: announcement.title })).toHaveAttribute('src', '/images/updates/reprogramacion-pasajes.png');
  });
  it('no permite enlaces que ejecuten código o redireccionen como rutas externas', () => {
    expect(safeUpdateLink('javascript:alert(1)')).toBeUndefined();
    expect(safeUpdateLink('//external.test')).toBeUndefined();
    expect(safeUpdateLink('/\\external.test')).toBeUndefined();
  });
  it('presenta imágenes como galería amplia sin descripción ni columna lateral', () => {
    render(<SystemUpdatesModal isOpen onClose={() => {}} updates={[{ ...announcement, description: null, image_url: '/images/updates/reprogramacion-pasajes.png' }]} />);
    expect(screen.getByRole('img', { name: announcement.title })).toHaveClass('object-contain');
    expect(screen.queryByText('Conoce qué cambió y cómo usarlo, paso a paso.')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entendido' })).toBeInTheDocument();
  });
  it('recorre imágenes con las flechas sin repetir el texto incluido en la imagen', () => {
    render(<SystemUpdatesModal isOpen onClose={() => {}} updates={[
      { ...announcement, image_url: '/images/one.png' },
      { ...announcement, id: 2, title: 'Segundo anuncio', image_url: '/images/two.png' },
    ]} />);
    expect(screen.queryByText('Abre la boleta.')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    expect(screen.getByRole('img', { name: 'Segundo anuncio' })).toHaveAttribute('src', '/images/two.png');
    fireEvent.click(screen.getByRole('button', { name: 'Anterior' }));
    expect(screen.getByRole('img', { name: announcement.title })).toHaveAttribute('src', '/images/one.png');
  });

});
