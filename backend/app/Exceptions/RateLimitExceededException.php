<?php

namespace App\Exceptions;

use Exception;

class RateLimitExceededException extends Exception
{
    public function __construct(string $message = 'Batas penggunaan harian tercapai.')
    {
        parent::__construct($message);
    }
}
