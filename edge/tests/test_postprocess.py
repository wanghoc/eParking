from eparking_edge.ai.postprocess import CharBox, assemble_plate, is_plausible_plate, is_two_line, plate_key
from eparking_edge.gate_controller import PlateVoter


def chars(spec):
    return [CharBox(label=l, x=x, y=y) for l, x, y in spec]


def test_two_line_motorbike_plate_is_split_on_mean_y_and_joined_with_dash():
    # Biển xe máy 49G1-11111, chiều cao ảnh cắt H=100. Đưa vào lộn xộn thứ tự.
    c = chars([
        ("1", 10, 75), ("G", 50, 25), ("1", 30, 75), ("4", 10, 25), ("1", 50, 75),
        ("9", 30, 25), ("1", 70, 75), ("1", 70, 25), ("1", 90, 75),
    ])
    assert is_two_line(c, crop_height=100)
    assert assemble_plate(c, crop_height=100) == "49G1-11111"


def test_one_line_plate_sorted_by_x_only():
    c = chars([("F", 30, 50), ("5", 10, 48), ("1", 20, 52), ("2", 50, 49), ("1", 40, 51)])
    assert not is_two_line(c, crop_height=100)
    assert assemble_plate(c, crop_height=100) == "51F12"


def test_spread_exactly_at_threshold_is_one_line():
    c = chars([("A", 10, 35), ("B", 20, 65), ("C", 30, 35), ("D", 40, 65)])
    assert assemble_plate(c, crop_height=100) == "ABCD"  # Δy = 30 không > 0.3·100


def test_fewer_than_four_chars_never_two_line():
    c = chars([("A", 10, 10), ("B", 20, 90), ("C", 30, 10)])
    assert assemble_plate(c, crop_height=100) == "ABC"


def test_empty():
    assert assemble_plate([], crop_height=100) == ""


def test_plate_key_and_plausibility():
    assert plate_key("49g1-111.11") == "49G111111"
    assert is_plausible_plate("49G1-11111")
    assert is_plausible_plate("51F-123.45")
    assert not is_plausible_plate("G1-11")
    assert not is_plausible_plate("")


def test_voter_requires_consecutive_frames_and_applies_cooldown():
    t = [0.0]
    v = PlateVoter(confirm_frames=2, cooldown_s=20, clock=lambda: t[0])
    assert v.feed("49G1-11111") is None
    assert v.feed("49G1-11111") == "49G1-11111"
    assert v.feed("49G1-11111") is None
    assert v.feed("49G1-11111") is None  # vẫn trong cooldown
    t[0] = 25
    assert v.feed("49G1-11111") is None
    assert v.feed("49G1-11111") == "49G1-11111"


def test_voter_resets_on_disagreement_or_noise():
    v = PlateVoter(confirm_frames=2, cooldown_s=0)
    assert v.feed("49G1-11111") is None
    assert v.feed("49G1-11117") is None
    assert v.feed(None) is None
    assert v.feed("49G1-11117") is None
    assert v.feed("49G1-11117") == "49G1-11117"
