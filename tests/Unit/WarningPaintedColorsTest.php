<?php

namespace Tests\Unit;

use App\Models\Warning;
use Tests\TestCase;

class WarningPaintedColorsTest extends TestCase
{
    public function test_rejects_yellow_districts_when_only_orange_code_is_declared(): void
    {
        $ok = Warning::paintedColorsMatchCodes(
            [['code' => 'COD PORTOCALIU']],
            [
                ['color' => '#FF8A00'],
                ['color' => '#FFED00'],
            ],
        );

        $this->assertFalse($ok);
    }

    public function test_accepts_only_declared_colors_on_the_map(): void
    {
        $ok = Warning::paintedColorsMatchCodes(
            [['code' => 'COD PORTOCALIU']],
            [['color' => '#FF8A00']],
        );

        $this->assertTrue($ok);
    }
}
