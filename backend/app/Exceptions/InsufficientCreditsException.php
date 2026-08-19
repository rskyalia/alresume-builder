<?php

namespace App\Exceptions;

use Exception;

class InsufficientCreditsException extends Exception
{
    public function __construct(string $message = 'Kredit resume habis. Upgrade ke Pro untuk melanjutkan.')
    {
        parent::__construct($message);
    }
}
