import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { ImageUpload } from '@/components/ImageUpload';
import * as apiClient from '@/lib/api-client';

describe('ImageUpload Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders upload dropzone with privacy notice', () => {
    render(<ImageUpload onChange={vi.fn()} />);

    expect(screen.getByText('Evidence Photo')).toBeInTheDocument();
    expect(screen.getByText(/RA 10173 Sanitized/i)).toBeInTheDocument();
    expect(screen.getByText(/Click or drop photo here/i)).toBeInTheDocument();
  });

  it('uploads valid image and triggers onChange callback', async () => {
    const onChangeMock = vi.fn();
    vi.spyOn(apiClient, 'uploadEvidencePhoto').mockResolvedValueOnce({
      file_url: '/api/v1/uploads/test-uuid-1234.jpg',
      filename: 'test-uuid-1234.jpg',
    });

    const { container } = render(<ImageUpload onChange={onChangeMock} />);

    const file = new File(['dummy-image-content'], 'evidence.jpg', {
      type: 'image/jpeg',
    });

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).not.toBeNull();

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(apiClient.uploadEvidencePhoto).toHaveBeenCalledWith(file);
      expect(onChangeMock).toHaveBeenCalledWith('/api/v1/uploads/test-uuid-1234.jpg');
    });
  });

  it('blocks files larger than 5MB with an error message', async () => {
    const onChangeMock = vi.fn();
    const spy = vi.spyOn(apiClient, 'uploadEvidencePhoto');

    const { container } = render(<ImageUpload onChange={onChangeMock} />);

    // 6MB file
    const bigFile = new File([new ArrayBuffer(6 * 1024 * 1024)], 'huge.jpg', {
      type: 'image/jpeg',
    });

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [bigFile] } });

    await waitFor(() => {
      expect(screen.getByText(/maximum allowed size is 5MB/i)).toBeInTheDocument();
      expect(spy).not.toHaveBeenCalled();
      expect(onChangeMock).not.toHaveBeenCalled();
    });
  });

  it('blocks unsupported file types', async () => {
    const onChangeMock = vi.fn();
    const spy = vi.spyOn(apiClient, 'uploadEvidencePhoto');

    const { container } = render(<ImageUpload onChange={onChangeMock} />);

    const badFile = new File(['text content'], 'notes.txt', {
      type: 'text/plain',
    });

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [badFile] } });

    await waitFor(() => {
      expect(screen.getByText(/unsupported file type/i)).toBeInTheDocument();
      expect(spy).not.toHaveBeenCalled();
    });
  });

  it('renders preview and remove button when value is provided', () => {
    const onChangeMock = vi.fn();
    render(
      <ImageUpload
        value="/api/v1/uploads/existing-photo.jpg"
        onChange={onChangeMock}
      />
    );

    expect(screen.getByText(/Photo Uploaded & Sanitized/i)).toBeInTheDocument();
    const removeBtn = screen.getByText(/Remove or replace photo/i);
    expect(removeBtn).toBeInTheDocument();

    fireEvent.click(removeBtn);
    expect(onChangeMock).toHaveBeenCalledWith('');
  });
});
