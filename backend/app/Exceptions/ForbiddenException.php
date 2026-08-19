<?php

namespace App\Exceptions;

use Exception;

class ForbiddenException extends Exception
{
    public function __construct(string $message = 'Akses ditolak.')
    {
        parent::__construct($message);
    }
}
