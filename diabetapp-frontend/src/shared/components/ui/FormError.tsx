import React from 'react';
import Banner from './Banner';

/** Error general del formulario: lo que no corresponde a un campo concreto. */
const FormError = ({ message }: { message?: string | null }) =>
  message ? <Banner tone="danger" message={message} /> : null;

export default FormError;
