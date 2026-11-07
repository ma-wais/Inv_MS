<?php

namespace App\Support;

use Illuminate\Http\Request;

final class ContactFields
{
    public static function normalize(Request $request): void
    {
        $values = [];
        foreach (['phone', 'cnic'] as $field) {
            if (! $request->exists($field)) {
                continue;
            }
            $value = $request->input($field);
            if (! is_string($value)) {
                continue;
            }
            $value = trim($value);
            if ($value === '') {
                $values[$field] = null;

                continue;
            }
            if ($field === 'phone' && preg_match('/^[+0-9\s()\-]+$/', $value)) {
                $digits = preg_replace('/\D/', '', $value);
                if (strlen($digits) === 14 && str_starts_with($digits, '0092')) {
                    $digits = substr($digits, 4);
                } elseif (strlen($digits) === 12 && str_starts_with($digits, '92')) {
                    $digits = substr($digits, 2);
                } elseif (strlen($digits) === 11 && str_starts_with($digits, '0')) {
                    $digits = substr($digits, 1);
                }
                $value = strlen($digits) === 10 ? '+92'.$digits : $value;
            } elseif ($field === 'cnic' && preg_match('/^[0-9\s\-]+$/', $value)) {
                $value = preg_replace('/\D/', '', $value);
            }
            $values[$field] = $value;
        }
        $request->merge($values);
    }

    public static function phoneRules(): array
    {
        return ['nullable', 'string', 'regex:/^\+92[1-9][0-9]{9}$/'];
    }

    public static function cnicRules(): array
    {
        return ['nullable', 'string', 'regex:/^[0-9]{13}$/'];
    }
}
