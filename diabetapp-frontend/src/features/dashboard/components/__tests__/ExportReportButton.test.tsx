import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import ExportReportButton from '../ExportReportButton';

const mockDownload = jest.fn();
let mockStatus: 'idle' | 'loading' | 'error' = 'idle';
let mockErrorMessage: string | null = null;

jest.mock('../../hooks/useExportReport', () => ({
  useExportReport: () => ({
    status: mockStatus,
    errorMessage: mockErrorMessage,
    download: mockDownload,
  }),
}));

describe('ExportReportButton', () => {
  beforeEach(() => {
    mockDownload.mockReset();
    mockStatus = 'idle';
    mockErrorMessage = null;
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => jest.restoreAllMocks());

  it('abre el selector de formato y descarga el elegido', async () => {
    const { getByRole } = await render(<ExportReportButton />);

    fireEvent.press(getByRole('button', { name: 'Exportar reporte' }));

    const alertMock = Alert.alert as jest.Mock;
    expect(alertMock).toHaveBeenCalledWith(
      'Exportar reporte',
      'Elige el formato del archivo',
      expect.any(Array),
    );

    const buttons = alertMock.mock.calls[0][2] as { text: string; onPress?: () => void }[];
    buttons.find((b) => b.text === 'PDF')?.onPress?.();

    expect(mockDownload).toHaveBeenCalledWith('pdf');
  });

  it('muestra una alerta de error cuando falla', async () => {
    mockStatus = 'error';
    mockErrorMessage = 'No se pudo conectar con el servidor.';

    await render(<ExportReportButton />);

    expect(Alert.alert).toHaveBeenCalledWith(
      'No se pudo exportar',
      'No se pudo conectar con el servidor.',
    );
  });

  it('muestra el estado de carga y deshabilita el botón', async () => {
    mockStatus = 'loading';

    const { getByRole } = await render(<ExportReportButton />);

    const button = getByRole('button', { name: 'Exportar reporte' });
    expect(button.props.accessibilityState).toMatchObject({ busy: true, disabled: true });
  });
});
